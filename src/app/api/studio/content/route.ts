import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { logAuditEvent } from '@/lib/finance/ledger';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Settings
  const settingsRes = await query(`SELECT key, value_json FROM site_settings`);
  const settings: Record<string, any> = {};
  for (const row of settingsRes.rows) {
    settings[row.key] = row.value_json;
  }

  // 2. Homepage Features
  const hfRes = await query(`
    SELECT hf.*, b.batch_code, ts.name AS series_name 
    FROM homepage_features hf
    JOIN batches b ON hf.batch_id = b.id
    JOIN trip_series ts ON b.trip_series_id = ts.id
    ORDER BY hf.sort_index ASC
  `);

  // 3. Adventure Stories
  const storiesRes = await query(`
    SELECT s.*, b.batch_code, ts.name AS series_name 
    FROM adventure_stories s
    JOIN batches b ON s.batch_id = b.id
    JOIN trip_series ts ON b.trip_series_id = ts.id
    ORDER BY s.created_at DESC
  `);

  return NextResponse.json({
    settings,
    homepageFeatures: hfRes.rows,
    stories: storiesRes.rows,
  });
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { action } = body;

  try {
    if (action === 'save_settings') {
      const { settings } = body;
      await withTransaction(async (client) => {
        for (const [key, value] of Object.entries(settings)) {
          await client.query(
            `INSERT INTO site_settings (key, value_json, updated_by_admin, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (key) DO UPDATE
             SET value_json = EXCLUDED.value_json,
                 updated_by_admin = EXCLUDED.updated_by_admin,
                 updated_at = CURRENT_TIMESTAMP`,
            [key, JSON.stringify(value), session.userId]
          );
        }

        await logAuditEvent(client, {
          adminUserId: session.userId,
          entityType: 'site_settings',
          entityId: randomUUID(),
          eventType: 'settings_updated',
          reason: 'Site settings updated',
          afterJson: settings,
        });
      });

      return NextResponse.json({ success: true, message: 'Pengaturan situs berhasil diperbarui.' });
    }

    if (action === 'save_story') {
      const { story } = body;
      await withTransaction(async (client) => {
        if (story.id) {
          await client.query(
            `UPDATE adventure_stories 
             SET headline = $1, story_text = $2, credited_name = $3,
                 consent_status = $4, publish_state = $5,
                 published_at = CASE WHEN $5 = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP ELSE published_at END
             WHERE id = $6`,
            [story.headline, story.story_text, story.credited_name, story.consent_status, story.publish_state, story.id]
          );
        } else {
          await client.query(
            `INSERT INTO adventure_stories (
              batch_id, headline, story_text, credited_name, consent_status, publish_state, published_at
            ) VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)`,
            [story.batch_id, story.headline, story.story_text, story.credited_name, story.consent_status, story.publish_state]
          );
        }
      });

      return NextResponse.json({ success: true, message: 'Cerita petualang berhasil disimpan.' });
    }

    if (action === 'set_featured_batch') {
      const { batchId } = body;
      await withTransaction(async (client) => {
        await client.query(`DELETE FROM homepage_features WHERE style_variant = 'featured'`);
        if (batchId) {
          await client.query(
            `INSERT INTO homepage_features (batch_id, sort_index, is_enabled, style_variant)
             VALUES ($1, 0, true, 'featured')`,
            [batchId]
          );
        }
      });

      return NextResponse.json({ success: true, message: 'Batch unggulan homepage berhasil diperbarui.' });
    }

    return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Content Studio] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menyimpan konten' }, { status: 500 });
  }
}
