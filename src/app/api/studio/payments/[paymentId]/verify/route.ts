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

  try {
    await withTransaction(async (client) => {
      const pRes = await client.query(
        `SELECT * FROM payments WHERE id = $1 FOR UPDATE`,
        [paymentId]
      );
      if (pRes.rowCount === 0) throw new Error('Pembayaran tidak ditemukan');
      const payment = pRes.rows[0];

      if (payment.status === 'verified') {
        throw new Error('Pembayaran ini sudah diverifikasi sebelumnya');
      }

      await client.query(
        `UPDATE payments 
         SET status = 'verified', verified_at = CURRENT_TIMESTAMP, verified_by_admin = $1 
         WHERE id = $2`,
        [session.userId, paymentId]
      );

      // Post ledger credit entry
      await postLedgerEntry(client, {
        bookingId: payment.booking_id,
        direction: 'credit',
        amountIdr: Number(payment.amount_idr),
        eventType: 'verified_payment',
        sourceKind: 'payment',
        sourceId: paymentId,
        postedBy: session.userId,
      });

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'payment',
        entityId: paymentId,
        bookingId: payment.booking_id,
        eventType: 'payment_verified',
        afterJson: { amountIdr: payment.amount_idr },
      });
    });

    return NextResponse.json({ success: true, message: 'Pembayaran berhasil diverifikasi.' });
  } catch (err: any) {
    console.error('[API Verify Payment] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memverifikasi pembayaran' }, { status: 400 });
  }
}
