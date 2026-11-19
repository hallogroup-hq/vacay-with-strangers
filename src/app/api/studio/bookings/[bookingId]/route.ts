import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { logAuditEvent } from '@/lib/finance/ledger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await params;

  // 1. Booking & Batch info
  const bRes = await query(
    `SELECT 
      b.*,
      bat.batch_code,
      bat.slug AS batch_slug,
      bat.departure_date,
      bat.return_date,
      bat.capacity,
      ts.name AS series_name,
      d.name AS destination_name,
      vb.total_debit_idr,
      vb.total_credit_idr,
      vb.outstanding_balance_idr
     FROM bookings b
     JOIN batches bat ON b.batch_id = bat.id
     JOIN trip_series ts ON bat.trip_series_id = ts.id
     JOIN destinations d ON ts.destination_id = d.id
     LEFT JOIN v_booking_balance vb ON vb.booking_id = b.id
     WHERE b.id = $1`,
    [bookingId]
  );
  if (bRes.rowCount === 0) {
    return NextResponse.json({ error: 'Booking tidak ditemukan' }, { status: 404 });
  }
  const booking = bRes.rows[0];

  // 2. Travelers, their Items, and Seat Allocations
  const travelersRes = await query(
    `SELECT 
      bt.id AS traveler_id,
      bt.full_name,
      bt.contact_phone,
      bt.status AS traveler_status,
      bi.id AS item_id,
      bi.agreed_price_idr,
      bi.agreed_dp_idr,
      bi.status AS item_status,
      bi.offer_snapshot_json,
      sa.id AS seat_allocation_id,
      sa.assigned_at,
      sa.released_at
     FROM booking_travelers bt
     JOIN booking_items bi ON bi.booking_traveler_id = bt.id
     LEFT JOIN seat_allocations sa ON sa.booking_item_id = bi.id AND sa.released_at IS NULL
     WHERE bt.booking_id = $1
     ORDER BY bt.created_at ASC`,
    [bookingId]
  );
  booking.travelers = travelersRes.rows;

  // 3. Payments
  const pRes = await query(
    `SELECT * FROM payments WHERE booking_id = $1 ORDER BY received_at DESC`,
    [bookingId]
  );
  booking.payments = pRes.rows;

  // 4. Ledger Entries
  const lRes = await query(
    `SELECT * FROM ledger_entries WHERE booking_id = $1 ORDER BY posted_at ASC`,
    [bookingId]
  );
  booking.ledger_entries = lRes.rows;

  return NextResponse.json({ booking });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await params;
  const body = await req.json();
  const { status, notesPrivate } = body;

  try {
    await withTransaction(async (client) => {
      const current = await client.query(`SELECT * FROM bookings WHERE id = $1`, [bookingId]);
      if (current.rowCount === 0) throw new Error('Booking tidak ditemukan');

      await client.query(
        `UPDATE bookings 
         SET status = COALESCE($1, status),
             notes_private = COALESCE($2, notes_private),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [status, notesPrivate, bookingId]
      );

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'booking',
        entityId: bookingId,
        bookingId,
        eventType: 'booking_status_updated',
        beforeJson: current.rows[0],
        afterJson: body,
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal update booking' }, { status: 500 });
  }
}
