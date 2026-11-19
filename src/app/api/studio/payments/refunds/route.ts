import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { postLedgerEntry, logAuditEvent } from '@/lib/finance/ledger';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = `
    SELECT 
      rc.*,
      b.booking_code,
      b.primary_contact_name,
      bat.batch_code,
      ts.name AS series_name,
      COALESCE(SUM(rci.approved_refund_idr), 0) AS total_approved_refund_idr,
      COALESCE(SUM(rp.amount_idr), 0) AS total_paid_refund_idr
    FROM refund_cases rc
    JOIN bookings b ON rc.booking_id = b.id
    JOIN batches bat ON b.batch_id = bat.id
    JOIN trip_series ts ON bat.trip_series_id = ts.id
    LEFT JOIN refund_case_items rci ON rci.refund_case_id = rc.id
    LEFT JOIN refund_payouts rp ON rp.refund_case_id = rc.id
    GROUP BY rc.id, b.booking_code, b.primary_contact_name, bat.batch_code, ts.name
    ORDER BY rc.requested_at DESC
  `;
  const res = await query(sql);
  return NextResponse.json({ refundCases: res.rows });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'create_case') {
      const { bookingId, initiatedBy, reason, items } = body;
      if (!bookingId || !reason || !Array.isArray(items)) {
        return NextResponse.json({ error: 'Data case refund tidak lengkap' }, { status: 400 });
      }

      const caseId = await withTransaction(async (client) => {
        const cRes = await client.query(
          `INSERT INTO refund_cases (booking_id, initiated_by, reason, status)
           VALUES ($1, $2, $3, 'requested') RETURNING id`,
          [bookingId, initiatedBy || 'participant', reason]
        );
        const cid = cRes.rows[0].id;

        for (const item of items) {
          await client.query(
            `INSERT INTO refund_case_items (refund_case_id, booking_item_id, decision_notes)
             VALUES ($1, $2, $3)`,
            [cid, item.bookingItemId, item.decisionNotes || null]
          );
        }

        await logAuditEvent(client, {
          adminUserId: session.userId,
          entityType: 'refund_case',
          entityId: cid,
          bookingId,
          eventType: 'refund_case_created',
          reason,
        });

        return cid;
      });

      return NextResponse.json({ success: true, caseId });
    }

    if (action === 'approve_case') {
      const { caseId, decisionReason, approvedItems } = body;
      if (!caseId || !Array.isArray(approvedItems)) {
        return NextResponse.json({ error: 'Data approval tidak lengkap' }, { status: 400 });
      }

      await withTransaction(async (client) => {
        await client.query(
          `UPDATE refund_cases 
           SET status = 'approved', decision_at = CURRENT_TIMESTAMP, decision_by_admin = $1, decision_notes = $2
           WHERE id = $3`,
          [session.userId, decisionReason || null, caseId]
        );

        for (const it of approvedItems) {
          await client.query(
            `UPDATE refund_case_items 
             SET approved_refund_idr = $1, approved_dp_refund_idr = $2, decision_notes = $3
             WHERE refund_case_id = $4 AND booking_item_id = $5`,
            [it.approvedRefundIdr || 0, it.approvedDpRefundIdr || 0, it.decisionNotes || null, caseId, it.bookingItemId]
          );
        }

        await logAuditEvent(client, {
          adminUserId: session.userId,
          entityType: 'refund_case',
          entityId: caseId,
          eventType: 'refund_case_approved',
          reason: decisionReason,
        });
      });

      return NextResponse.json({ success: true, message: 'Kasus refund berhasil disetujui.' });
    }

    if (action === 'record_payout') {
      const { caseId, amountIdr, transferReference } = body;
      if (!caseId || !amountIdr || amountIdr <= 0) {
        return NextResponse.json({ error: 'caseId dan nominal pencairan wajib valid' }, { status: 400 });
      }

      await withTransaction(async (client) => {
        const cRes = await client.query(`SELECT booking_id, status FROM refund_cases WHERE id = $1 FOR UPDATE`, [caseId]);
        if (cRes.rowCount === 0) throw new Error('Kasus refund tidak ditemukan');
        const rcase = cRes.rows[0];

        if (rcase.status !== 'approved' && rcase.status !== 'partially_paid') {
          throw new Error('Kasus refund harus disetujui (approved) sebelum pencairan dana dapat dicatat.');
        }

        const pRes = await client.query(
          `INSERT INTO refund_payouts (refund_case_id, amount_idr, status, transfer_reference, entered_by_admin)
           VALUES ($1, $2, 'paid', $3, $4) RETURNING id`,
          [caseId, amountIdr, transferReference || null, session.userId]
        );
        const payoutId = pRes.rows[0].id;

        // Post ledger debit entry (money-out reducing held funds)
        await postLedgerEntry(client, {
          bookingId: rcase.booking_id,
          direction: 'debit',
          amountIdr: Number(amountIdr),
          eventType: 'refund_payout',
          sourceKind: 'refund_payout',
          sourceId: payoutId,
          postedBy: session.userId,
        });

        await client.query(`UPDATE refund_cases SET status = 'paid' WHERE id = $1`, [caseId]);

        await logAuditEvent(client, {
          adminUserId: session.userId,
          entityType: 'refund_payout',
          entityId: payoutId,
          bookingId: rcase.booking_id,
          eventType: 'refund_paid',
          afterJson: { amountIdr, transferReference },
        });
      });

      return NextResponse.json({ success: true, message: 'Pencairan refund berhasil dicatat dan diposting ke buku kas.' });
    }

    return NextResponse.json({ error: 'Action tidak dikenal' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Refunds] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memproses refund' }, { status: 400 });
  }
}
