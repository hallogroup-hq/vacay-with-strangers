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
  const { travelerId, reason = 'Pembatalan atas inisiatif peserta (DP forfeited)' } = body;

  if (!travelerId) {
    return NextResponse.json({ error: 'travelerId wajib disertakan' }, { status: 400 });
  }

  try {
    await withTransaction(async (client) => {
      // 1. Fetch traveler and item
      const itemRes = await client.query(
        `SELECT bi.*, bt.full_name, sa.id AS seat_allocation_id
         FROM booking_items bi
         JOIN booking_travelers bt ON bi.booking_traveler_id = bt.id
         LEFT JOIN seat_allocations sa ON sa.booking_item_id = bi.id AND sa.released_at IS NULL
         WHERE bi.booking_id = $1 AND bt.id = $2 FOR UPDATE`,
        [bookingId, travelerId]
      );
      if (itemRes.rowCount === 0) throw new Error('Data traveler tidak ditemukan pada booking ini');
      const item = itemRes.rows[0];

      if (item.status === 'cancelled') {
        throw new Error('Peserta ini sudah berstatus batal.');
      }

      // 2. Mark traveler and item cancelled
      await client.query(`UPDATE booking_travelers SET status = 'cancelled' WHERE id = $1`, [travelerId]);
      await client.query(`UPDATE booking_items SET status = 'cancelled' WHERE id = $1`, [item.id]);

      // 3. Release seat if actively allocated
      if (item.seat_allocation_id) {
        await releaseSeatTransactional(client, {
          seatAllocationId: item.seat_allocation_id,
          adminId: session.userId,
          reason,
        });
      }

      // 4. Contractual ledger adjustment: relief of remaining amount (agreed_price - agreed_dp)
      const agreedPrice = Number(item.agreed_price_idr);
      const agreedDp = Number(item.agreed_dp_idr);
      const reliefAmount = Math.max(0, agreedPrice - agreedDp);

      if (reliefAmount > 0) {
        // Record adjustment row
        const adjRes = await client.query(
          `INSERT INTO booking_adjustments (
            booking_id, booking_item_id, signed_delta_idr, adjustment_type, reason_text, approved_by_admin
          ) VALUES ($1, $2, $3, 'cancellation_relief', $4, $5)
          RETURNING id`,
          [bookingId, item.id, -reliefAmount, reason, session.userId]
        );

        // Post ledger entry reducing obligation
        await postLedgerEntry(client, {
          bookingId,
          bookingItemId: item.id,
          direction: 'credit',
          amountIdr: reliefAmount,
          eventType: 'cancellation_relief',
          sourceKind: 'booking_adjustment',
          sourceId: adjRes.rows[0].id,
          postedBy: session.userId,
        });
      }

      // 5. Check if all travelers in this booking are cancelled
      const countRes = await client.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'active') AS active_count,
          COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count
         FROM booking_travelers WHERE booking_id = $1`,
        [bookingId]
      );
      const activeCount = parseInt(countRes.rows[0].active_count, 10);

      const newBookingStatus = activeCount === 0 ? 'cancelled' : 'partially_cancelled';
      await client.query(`UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [
        newBookingStatus,
        bookingId,
      ]);

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'booking_traveler',
        entityId: travelerId,
        bookingId,
        eventType: 'traveler_cancelled',
        afterJson: { travelerName: item.full_name, reliefAmount, dpForfeited: agreedDp },
        reason,
      });
    });

    return NextResponse.json({ success: true, message: 'Peserta berhasil dibatalkan dan buku kas direkonsiliasi.' });
  } catch (err: any) {
    console.error('[API Cancel Traveler] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal membatalkan peserta' }, { status: 400 });
  }
}
