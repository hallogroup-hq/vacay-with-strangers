import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { withTransaction } from '@/lib/db';
import { releaseSeatTransactional, postLedgerEntry, logAuditEvent } from '@/lib/finance/ledger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await params;
  const body = await req.json();
  const {
    travelerId,
    destinationBatchId,
    destinationPriceOptionId,
    transferDp = false,
    reason = 'Reschedule atas persetujuan admin',
  } = body;

  if (!travelerId || !destinationBatchId || !destinationPriceOptionId) {
    return NextResponse.json(
      { error: 'travelerId, destinationBatchId, dan destinationPriceOptionId wajib diisi' },
      { status: 400 }
    );
  }

  try {
    const result = await withTransaction(async (client) => {
      // 1. Fetch source booking & traveler item
      const srcRes = await client.query(
        `SELECT b.batch_id, b.primary_contact_name, b.primary_contact_phone, b.primary_contact_email,
                bt.full_name, bt.contact_phone,
                bi.id AS source_item_id, bi.agreed_price_idr, bi.agreed_dp_idr,
                sa.id AS seat_allocation_id
         FROM bookings b
         JOIN booking_travelers bt ON bt.booking_id = b.id
         JOIN booking_items bi ON bi.booking_traveler_id = bt.id
         LEFT JOIN seat_allocations sa ON sa.booking_item_id = bi.id AND sa.released_at IS NULL
         WHERE b.id = $1 AND bt.id = $2 FOR UPDATE`,
        [bookingId, travelerId]
      );
      if (srcRes.rowCount === 0) throw new Error('Data traveler sumber tidak ditemukan');
      const src = srcRes.rows[0];

      if (src.batch_id === destinationBatchId) {
        throw new Error('Batch tujuan harus berbeda dari batch asal');
      }

      // 2. Fetch destination offer details
      const destOfferRes = await client.query(
        `SELECT * FROM v_current_offers WHERE offer_id = $1`,
        [destinationPriceOptionId]
      );
      if (destOfferRes.rowCount === 0) throw new Error('Opsi paket tujuan tidak ditemukan');
      const destOffer = destOfferRes.rows[0];

      // 3. Create linked destination booking
      const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newBookingCode = `VWS-RES-${datePrefix}-${randomSuffix}`;

      const newBookingRes = await client.query(
        `INSERT INTO bookings (
          batch_id, booking_code, primary_contact_name, primary_contact_phone,
          primary_contact_email, status, source, notes_private, created_by_admin
        ) VALUES ($1, $2, $3, $4, $5, 'pending', 'manual', $6, $7)
        RETURNING id`,
        [
          destinationBatchId,
          newBookingCode,
          src.primary_contact_name,
          src.primary_contact_phone,
          src.primary_contact_email,
          `Hasil reschedule dari booking ${bookingId}. Alasan: ${reason}`,
          session.userId,
        ]
      );
      const destBookingId = newBookingRes.rows[0].id;

      // 4. Create destination traveler & item
      const destTravelerRes = await client.query(
        `INSERT INTO booking_travelers (booking_id, full_name, contact_phone, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [destBookingId, src.full_name, src.contact_phone]
      );
      const destTravelerId = destTravelerRes.rows[0].id;

      const destAgreedPrice = Number(destOffer.effective_price_idr);
      const destAgreedDp = Number(destOffer.dp_per_traveler_idr);

      const destItemRes = await client.query(
        `INSERT INTO booking_items (
          booking_id, booking_traveler_id, price_option_id, offer_snapshot_json,
          agreed_price_idr, agreed_dp_idr, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING id`,
        [
          destBookingId,
          destTravelerId,
          destinationPriceOptionId,
          JSON.stringify(destOffer),
          destAgreedPrice,
          destAgreedDp,
        ]
      );
      const destItemId = destItemRes.rows[0].id;

      // Post initial debit charge on destination booking
      await postLedgerEntry(client, {
        bookingId: destBookingId,
        bookingItemId: destItemId,
        direction: 'debit',
        amountIdr: destAgreedPrice,
        eventType: 'booking_charge',
        sourceKind: 'booking_item',
        sourceId: destItemId,
        postedBy: session.userId,
      });

      // 5. Update source traveler & item status
      await client.query(`UPDATE booking_travelers SET status = 'rescheduled' WHERE id = $1`, [travelerId]);
      await client.query(`UPDATE booking_items SET status = 'rescheduled' WHERE id = $1`, [src.source_item_id]);

      // Release source seat allocation
      if (src.seat_allocation_id) {
        await releaseSeatTransactional(client, {
          seatAllocationId: src.seat_allocation_id,
          adminId: session.userId,
          reason: `Pindah ke batch baru (${newBookingCode})`,
        });
      }

      // 6. Record reschedule case
      const caseRes = await client.query(
        `INSERT INTO reschedule_cases (
          source_booking_id, destination_booking_id, source_batch_id, destination_batch_id,
          status, reason, approved_by_admin, approved_at
        ) VALUES ($1, $2, $3, $4, 'applied', $5, $6, CURRENT_TIMESTAMP)
        RETURNING id`,
        [bookingId, destBookingId, src.batch_id, destinationBatchId, reason, session.userId]
      );
      const caseId = caseRes.rows[0].id;

      // 7. Handle DP Transfer Decision
      const dpAmount = Number(src.agreed_dp_idr);
      const dpTransferDecision = transferDp ? 'approved_transfer' : 'forfeited';
      const approvedDpCredit = transferDp ? dpAmount : 0;

      await client.query(
        `INSERT INTO reschedule_case_items (
          reschedule_case_id, source_booking_item_id, destination_booking_item_id,
          dp_credit_decision, approved_dp_credit_idr, decision_notes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [caseId, src.source_item_id, destItemId, dpTransferDecision, approvedDpCredit, reason]
      );

      // Contract adjustment on source booking: relief of the remaining balance (and DP if transferred)
      const sourceRelief = Number(src.agreed_price_idr) - (transferDp ? 0 : dpAmount);
      await postLedgerEntry(client, {
        bookingId,
        bookingItemId: src.source_item_id,
        direction: 'credit',
        amountIdr: sourceRelief,
        eventType: 'cancellation_relief',
        sourceKind: 'reschedule_case',
        sourceId: caseId,
        postedBy: session.userId,
      });

      // If DP transfer approved, record symmetrical credit transfer
      if (transferDp && approvedDpCredit > 0) {
        const transferRes = await client.query(
          `INSERT INTO credit_transfers (
            reschedule_case_id, source_booking_id, destination_booking_id,
            source_booking_item_id, destination_booking_item_id, dp_component_idr,
            total_credit_idr, status, approved_by_admin
          ) VALUES ($1, $2, $3, $4, $5, $6, $6, 'applied', $7)
          RETURNING id`,
          [caseId, bookingId, destBookingId, src.source_item_id, destItemId, approvedDpCredit, session.userId]
        );
        const transferId = transferRes.rows[0].id;

        // Source debit (internal funds moved out)
        await postLedgerEntry(client, {
          bookingId,
          bookingItemId: src.source_item_id,
          direction: 'debit',
          amountIdr: approvedDpCredit,
          eventType: 'outbound_credit_transfer',
          sourceKind: 'credit_transfer',
          sourceId: transferId,
          postedBy: session.userId,
        });

        // Destination credit (internal funds received)
        await postLedgerEntry(client, {
          bookingId: destBookingId,
          bookingItemId: destItemId,
          direction: 'credit',
          amountIdr: approvedDpCredit,
          eventType: 'inbound_credit_transfer',
          sourceKind: 'credit_transfer',
          sourceId: transferId,
          postedBy: session.userId,
        });
      }

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'reschedule_case',
        entityId: caseId,
        bookingId,
        eventType: 'traveler_rescheduled',
        afterJson: {
          travelerName: src.full_name,
          destBookingCode: newBookingCode,
          transferDp,
          approvedDpCredit,
        },
        reason,
      });

      return { destBookingId, newBookingCode, approvedDpCredit };
    });

    return NextResponse.json({
      success: true,
      message: 'Peserta berhasil dipindahkan ke batch baru.',
      ...result,
    });
  } catch (err: any) {
    console.error('[API Reschedule Traveler] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memproses reschedule' }, { status: 400 });
  }
}
