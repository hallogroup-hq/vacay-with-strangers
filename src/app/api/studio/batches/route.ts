import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { logAuditEvent } from '@/lib/finance/ledger';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = `
    SELECT 
      b.id,
      b.batch_code,
      b.departure_date,
      b.return_date,
      b.capacity,
      b.booking_state,
      ts.name AS series_name,
      d.name AS destination_name,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status
    FROM batches b
    JOIN trip_series ts ON b.trip_series_id = ts.id
    JOIN destinations d ON ts.destination_id = d.id
    JOIN v_batch_seat_status bss ON bss.batch_id = b.id
    ORDER BY b.departure_date ASC
  `;
  const res = await query(sql);

  // Also fetch current offers for each batch
  const offersRes = await query(`SELECT * FROM v_current_offers ORDER BY effective_price_idr DESC`);

  return NextResponse.json({
    batches: res.rows,
    offers: offersRes.rows,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      tripSeriesId,
      batchCode,
      departureDate,
      returnDate,
      capacity = 12,
      bookingState = 'coming_soon',
      title,
      lead,
      routeSummary,
    } = body;

    if (!tripSeriesId || !batchCode || !departureDate || !returnDate) {
      return NextResponse.json(
        { error: 'Trip series, batch code, dan tanggal keberangkatan/kepulangan wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await withTransaction(async (client) => {
      // 1. Generate unique batch slug
      const seriesRes = await client.query(`SELECT slug FROM trip_series WHERE id = $1`, [tripSeriesId]);
      if (seriesRes.rowCount === 0) throw new Error('Trip series tidak ditemukan');
      const seriesSlug = seriesRes.rows[0].slug;

      const slugBase = `${seriesSlug}-${batchCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const uniqueSlug = `${slugBase}-${Date.now().toString().slice(-4)}`;

      // 2. Insert Batch
      const batchRes = await client.query(
        `INSERT INTO batches (
          trip_series_id, batch_code, slug, departure_date, return_date,
          capacity, booking_state, show_exact_seats, limited_seats_threshold
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, 3)
        RETURNING id`,
        [tripSeriesId, batchCode, uniqueSlug, departureDate, returnDate, capacity, bookingState]
      );
      const batchId = batchRes.rows[0].id;

      // 3. Create Initial Draft Content Version (Revision 1)
      const verRes = await client.query(
        `INSERT INTO batch_content_versions (
          batch_id, revision_no, status, title, lead, route_summary, created_by_admin
        ) VALUES ($1, 1, 'draft', $2, $3, $4, $5)
        RETURNING id`,
        [batchId, title || `Trip ${batchCode}`, lead || null, routeSummary || null, session.userId]
      );
      const versionId = verRes.rows[0].id;

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'batch',
        entityId: batchId,
        eventType: 'batch_created',
        afterJson: { batchCode, departureDate, returnDate, capacity, bookingState, versionId },
      });

      return { batchId, versionId };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[API Create Batch] Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat batch baru' }, { status: 500 });
  }
}
