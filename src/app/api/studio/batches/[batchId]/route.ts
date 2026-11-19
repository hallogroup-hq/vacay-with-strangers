import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { publishBatchRevision } from '@/lib/db/queries';
import { logAuditEvent } from '@/lib/finance/ledger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;

  const sql = `
    SELECT 
      b.*,
      ts.name AS series_name,
      d.name AS destination_name,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status,
      v.id AS current_version_id,
      v.revision_no,
      v.status AS version_status,
      v.title,
      v.lead,
      v.route_summary,
      v.departure_meeting_info
    FROM batches b
    JOIN trip_series ts ON b.trip_series_id = ts.id
    JOIN destinations d ON ts.destination_id = d.id
    JOIN v_batch_seat_status bss ON bss.batch_id = b.id
    LEFT JOIN batch_content_versions v 
      ON v.batch_id = b.id 
      ORDER BY v.revision_no DESC 
      LIMIT 1
  `;
  const res = await query(sql, [batchId]);
  if (res.rowCount === 0) {
    return NextResponse.json({ error: 'Batch tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ batch: res.rows[0] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;
  const body = await req.json();
  const {
    batchCode,
    departureDate,
    returnDate,
    capacity,
    bookingState,
    showExactSeats,
    title,
    lead,
    routeSummary,
    departureMeetingInfo,
  } = body;

  try {
    await withTransaction(async (client) => {
      // 1. Update batch table
      await client.query(
        `UPDATE batches 
         SET batch_code = COALESCE($1, batch_code),
             departure_date = COALESCE($2, departure_date),
             return_date = COALESCE($3, return_date),
             capacity = COALESCE($4, capacity),
             booking_state = COALESCE($5, booking_state),
             show_exact_seats = COALESCE($6, show_exact_seats),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [batchCode, departureDate, returnDate, capacity, bookingState, showExactSeats, batchId]
      );

      // 2. Update latest draft version content if provided
      if (title || lead || routeSummary || departureMeetingInfo) {
        const verRes = await client.query(
          `SELECT id, status FROM batch_content_versions 
           WHERE batch_id = $1 
           ORDER BY revision_no DESC LIMIT 1`,
          [batchId]
        );

        if (verRes.rowCount! > 0) {
          const ver = verRes.rows[0];
          await client.query(
            `UPDATE batch_content_versions
             SET title = COALESCE($1, title),
                 lead = COALESCE($2, lead),
                 route_summary = COALESCE($3, route_summary),
                 departure_meeting_info = COALESCE($4, departure_meeting_info)
             WHERE id = $5`,
            [title, lead, routeSummary, departureMeetingInfo, ver.id]
          );
        }
      }

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'batch',
        entityId: batchId,
        eventType: 'batch_updated',
        afterJson: body,
      });
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API Update Batch] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memperbarui batch' }, { status: 500 });
  }
}

// POST: Publish Revision
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;
  const body = await req.json();
  const { versionId } = body;

  if (!versionId) {
    return NextResponse.json({ error: 'versionId wajib disertakan' }, { status: 400 });
  }

  try {
    await publishBatchRevision(batchId, versionId, session.userId);
    return NextResponse.json({ success: true, message: 'Versi revisi berhasil dipublikasikan ke publik.' });
  } catch (err: any) {
    console.error('[API Publish Revision] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mempublikasikan revisi' }, { status: 500 });
  }
}
