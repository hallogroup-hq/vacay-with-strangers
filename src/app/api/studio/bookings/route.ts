import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { createManualBooking } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const batchId = searchParams.get('batchId');

  let sql = `
    SELECT 
      b.id,
      b.booking_code,
      b.primary_contact_name,
      b.primary_contact_phone,
      b.primary_contact_email,
      b.status,
      b.source,
      b.created_at,
      bat.batch_code,
      ts.name AS series_name,
      COUNT(bt.id) AS travelers_count,
      vb.total_debit_idr,
      vb.total_credit_idr,
      vb.outstanding_balance_idr
    FROM bookings b
    JOIN batches bat ON b.batch_id = bat.id
    JOIN trip_series ts ON bat.trip_series_id = ts.id
    LEFT JOIN booking_travelers bt ON bt.booking_id = b.id
    LEFT JOIN v_booking_balance vb ON vb.booking_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    params.push(status);
    sql += ` AND b.status = $${params.length}`;
  }
  if (batchId) {
    params.push(batchId);
    sql += ` AND b.batch_id = $${params.length}`;
  }
  if (search) {
    params.push(`%${search.trim()}%`);
    sql += ` AND (
      b.booking_code ILIKE $${params.length} OR
      b.primary_contact_name ILIKE $${params.length} OR
      b.primary_contact_phone ILIKE $${params.length}
    )`;
  }

  sql += `
    GROUP BY b.id, b.booking_code, b.primary_contact_name, b.primary_contact_phone,
             b.primary_contact_email, b.status, b.source, b.created_at, bat.batch_code,
             ts.name, vb.total_debit_idr, vb.total_credit_idr, vb.outstanding_balance_idr
    ORDER BY b.created_at DESC
  `;

  const res = await query(sql, params);
  return NextResponse.json({ bookings: res.rows });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      batchId,
      primaryContactName,
      primaryContactPhone,
      primaryContactEmail,
      source,
      notesPrivate,
      travelers,
    } = body;

    if (!batchId || !primaryContactName || !primaryContactPhone || !Array.isArray(travelers) || travelers.length === 0) {
      return NextResponse.json(
        { error: 'Batch, kontak utama, dan minimal 1 traveler wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await createManualBooking({
      batchId,
      primaryContactName,
      primaryContactPhone,
      primaryContactEmail,
      source,
      notesPrivate,
      travelers,
      adminId: session.userId,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[API Create Booking] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal membuat reservasi' }, { status: 500 });
  }
}
