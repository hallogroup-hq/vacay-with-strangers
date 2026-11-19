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

  const verRes = await query(
    `SELECT id, revision_no, status FROM batch_content_versions 
     WHERE batch_id = $1 
     ORDER BY revision_no DESC LIMIT 1`,
    [batchId]
  );
  if (verRes.rowCount === 0) {
    return NextResponse.json({ priceOptions: [] });
  }

  const offersRes = await query(
    `SELECT * FROM price_options WHERE version_id = $1 ORDER BY list_price_idr DESC`,
    [verRes.rows[0].id]
  );

  return NextResponse.json({
    version: verRes.rows[0],
    priceOptions: offersRes.rows,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;
  const body = await req.json();
  const { priceOptions } = body;

  if (!Array.isArray(priceOptions)) {
    return NextResponse.json({ error: 'Payload priceOptions tidak valid' }, { status: 400 });
  }

  try {
    await withTransaction(async (client) => {
      const verRes = await client.query(
        `SELECT id, revision_no, status FROM batch_content_versions 
         WHERE batch_id = $1 
         ORDER BY revision_no DESC LIMIT 1 FOR UPDATE`,
        [batchId]
      );

      let targetVersionId: string;
      if (verRes.rowCount === 0 || verRes.rows[0].status === 'published') {
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

      await client.query(`DELETE FROM price_options WHERE version_id = $1`, [targetVersionId]);

      for (const po of priceOptions) {
        await client.query(
          `INSERT INTO price_options (
            version_id, sku, display_name, package_type, room_type, list_price_idr,
            promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
            included_json, excluded_json, land_meeting_info, is_enabled
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            targetVersionId,
            po.sku || `SKU-${Date.now().toString().slice(-4)}`,
            po.display_name,
            po.package_type,
            po.room_type || 'sharing',
            po.list_price_idr,
            po.promo_price_idr || null,
            po.promo_start_at || null,
            po.promo_end_at || null,
            po.dp_per_traveler_idr,
            JSON.stringify(po.included_json || []),
            JSON.stringify(po.excluded_json || []),
            po.land_meeting_info || null,
            po.is_enabled !== false,
          ]
        );
      }

      await logAuditEvent(client, {
        adminUserId: session.userId,
        entityType: 'batch_pricing',
        entityId: targetVersionId,
        eventType: 'pricing_saved',
        afterJson: { count: priceOptions.length },
      });
    });

    return NextResponse.json({ success: true, message: 'Harga dan paket berhasil disimpan.' });
  } catch (err: any) {
    console.error('[API Pricing Save] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menyimpan harga dan paket' }, { status: 500 });
  }
}
