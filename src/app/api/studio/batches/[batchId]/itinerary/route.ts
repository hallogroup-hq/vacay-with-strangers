import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { logAuditEvent } from '@/lib/finance/ledger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;

  // Find latest version
  const verRes = await query(
    `SELECT id, revision_no, status FROM batch_content_versions 
     WHERE batch_id = $1 
     ORDER BY revision_no DESC LIMIT 1`,
    [batchId]
  );
  if (verRes.rowCount === 0) {
    return NextResponse.json({ days: [] });
  }
  const version = verRes.rows[0];

  const daysRes = await query(
    `SELECT id, day_no, local_date, title, description 
     FROM itinerary_days 
     WHERE version_id = $1 
     ORDER BY day_no ASC`,
    [version.id]
  );

  for (const day of daysRes.rows) {
    const actRes = await query(
      `SELECT id, sort_index, start_local_time, end_local_time, activity_type,
              title, details, location_name, is_optional
       FROM itinerary_activities 
       WHERE itinerary_day_id = $1 
       ORDER BY sort_index ASC`,
      [day.id]
    );
    day.activities = actRes.rows;
  }

  return NextResponse.json({ version, days: daysRes.rows });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;
  const body = await req.json();
  const { days } = body; // Array of days with activities

  if (!Array.isArray(days)) {
    return NextResponse.json({ error: 'Payload days tidak valid' }, { status: 400 });
  }

  try {
    await withTransaction(async (client) => {
      // 1. Get or create draft version
      const verRes = await client.query(
        `SELECT id, revision_no, status FROM batch_content_versions 
         WHERE batch_id = $1 
         ORDER BY revision_no DESC LIMIT 1 FOR UPDATE`,
        [batchId]
      );

      let targetVersionId: string;
      if (verRes.rowCount === 0 || verRes.rows[0].status === 'published') {
        // Create new draft revision
        const nextRev = (verRes.rows[0]?.revision_no || 0) + 1;
        const newVer = await client.query(
          `INSERT INTO batch_content_versions (batch_id, revision_no, status, title, created_by_admin)
           VALUES ($1, $2, 'draft', 'Draft Revision', $3)
           RETURNING id`,
          [batchId, nextRev, session.userId]
        );
        targetVersionId = newVer.rows[0].id;
      } else {
        targetVersionId = verRes.rows[0].id;
      }

      // 2. Clear existing days in this draft version and insert updated
      await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [targetVersionId]);

      for (const d of days) {
        const dayRes = await client.query(
          `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [targetVersionId, d.day_no, d.local_date || null, d.title || `Hari ${d.day_no}`, d.description || null]
        );
        const dayId = dayRes.rows[0].id;

        if (Array.isArray(d.activities)) {
          for (let i = 0; i < d.activities.length; i++) {
            const act = d.activities[i];
            await client.query(
              `INSERT INTO itinerary_activities (
                itinerary_day_id, sort_index, start_local_time, activity_type, title, location_name, is_optional
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                dayId,
                i + 1,
                act.start_local_time || null,
                act.activity_type || 'general',
                act.title || 'Aktivitas',
                act.location_name || null,
                Boolean(act.is_optional),
              ]
            );
          }
        }
      }

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'batch_itinerary',
        entityId: targetVersionId,
        eventType: 'itinerary_saved',
        afterJson: { daysCount: days.length },
      });
    });

    return NextResponse.json({ success: true, message: 'Itinerary berhasil disimpan sebagai draf.' });
  } catch (err: any) {
    console.error('[API Itinerary Save] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menyimpan itinerary' }, { status: 500 });
  }
}
