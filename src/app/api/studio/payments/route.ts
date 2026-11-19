import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { logAuditEvent } from '@/lib/finance/ledger';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const bookingId = searchParams.get('bookingId');

  let sql = `
    SELECT 
      p.*,
      b.booking_code,
      b.primary_contact_name,
      bat.batch_code,
      ts.name AS series_name
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN batches bat ON b.batch_id = bat.id
    JOIN trip_series ts ON bat.trip_series_id = ts.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    params.push(status);
    sql += ` AND p.status = $${params.length}`;
  }
  if (bookingId) {
    params.push(bookingId);
    sql += ` AND p.booking_id = $${params.length}`;
  }

  sql += ` ORDER BY p.received_at DESC`;

  const res = await query(sql, params);
  return NextResponse.json({ payments: res.rows });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      bookingId,
      amountIdr,
      paymentChannel = 'bank_transfer',
      externalReference,
      receivedAt,
      notes,
    } = body;

    if (!bookingId || !amountIdr || amountIdr <= 0) {
      return NextResponse.json({ error: 'bookingId dan nominal pembayaran harus valid' }, { status: 400 });
    }

    const paymentRes = await withTransaction(async (client) => {
      const insRes = await client.query(
        `INSERT INTO payments (
          booking_id, amount_idr, status, payment_channel, external_reference,
          received_at, notes
        ) VALUES ($1, $2, 'pending_verification', $3, $4, COALESCE($5, CURRENT_TIMESTAMP), $6)
        RETURNING id`,
        [bookingId, amountIdr, paymentChannel, externalReference || null, receivedAt || null, notes || null]
      );
      const paymentId = insRes.rows[0].id;

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'payment',
        entityId: paymentId,
        bookingId,
        eventType: 'payment_recorded',
        afterJson: { amountIdr, paymentChannel, externalReference },
      });

      return paymentId;
    });

    return NextResponse.json({ success: true, paymentId: paymentRes });
  } catch (err: any) {
    console.error('[API Record Payment] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mencatat pembayaran' }, { status: 500 });
  }
}
