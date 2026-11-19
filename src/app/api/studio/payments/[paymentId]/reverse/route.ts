import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { withTransaction } from '@/lib/db';
import { postLedgerEntry, logAuditEvent } from '@/lib/finance/ledger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentId } = await params;
  const body = await req.json();
  const { reason = 'Koreksi bukti transfer' } = body;

  try {
    await withTransaction(async (client) => {
      const pRes = await client.query(
        `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );
      if (pRes.rowCount === 0) throw new Error('Pembayaran tidak ditemukan');
      const payment = pRes.rows[0];

      if (payment.status !== 'verified') {
        throw new Error('Hanya pembayaran yang sudah diverifikasi yang dapat dibalik (reversed)');
      }

      await client.query(`UPDATE payments SET status = 'reversed' WHERE id = $1`, [paymentId]);

      // Find original verified entry to reference
      const origRes = await client.query(
        `SELECT id FROM ledger_entries 
         WHERE source_id = $1 AND event_type = 'verified_payment'`,
        [paymentId]
      );
      const origId = origRes.rows[0]?.id || null;

      // Post compensating debit entry
      await postLedgerEntry(client, {
        bookingId: payment.booking_id,
        direction: 'debit',
        amountIdr: Number(payment.amount_idr),
        eventType: 'reversal',
        sourceKind: 'payment',
        sourceId: paymentId,
        reversalOfEntryId: origId,
        postedBy: session.userId,
      });

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'payment',
        entityId: paymentId,
        bookingId: payment.booking_id,
        eventType: 'payment_reversed',
        reason,
      });
    });

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil dibalik (reversed).' });
  } catch (err: any) {
    console.error('[API Reverse Payment] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal membalik pembayaran' }, { status: 400 });
  }
}
