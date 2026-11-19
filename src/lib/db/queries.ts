import { query, withTransaction } from './index';
import {
  allocateSeatTransactional,
  releaseSeatTransactional,
  postLedgerEntry,
  logAuditEvent,
} from '../finance/ledger';

// ============================================================================
// PUBLIC READ QUERIES (Zero Draft Leaks, View-backed)
// ============================================================================

export async function getPublicFeaturedBatch() {
  const sql = `
    SELECT 
      b.*,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status,
      co.effective_price_idr AS price_from,
      co.promo_price_idr,
      co.is_promo_active
    FROM v_published_batch_detail b
    JOIN v_batch_seat_status bss ON bss.batch_id = b.batch_id
    LEFT JOIN LATERAL (
      SELECT effective_price_idr, promo_price_idr, is_promo_active
      FROM v_current_offers
      WHERE version_id = b.version_id
      ORDER BY effective_price_idr ASC
      LIMIT 1
    ) co ON true
    ORDER BY b.departure_date ASC
    LIMIT 1
  `;
  const res = await query(sql);
  return res.rows[0] || null;
}

export async function getPublicBatches(filters?: {
  countryCode?: string;
  season?: string;
  month?: string;
  status?: string;
}) {
  let sql = `
    SELECT 
      b.*,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status,
      co.effective_price_idr AS price_from,
      co.list_price_idr,
      co.promo_price_idr,
      co.is_promo_active
    FROM v_published_batch_detail b
    JOIN v_batch_seat_status bss ON bss.batch_id = b.batch_id
    LEFT JOIN LATERAL (
      SELECT effective_price_idr, list_price_idr, promo_price_idr, is_promo_active
      FROM v_current_offers
      WHERE version_id = b.version_id
      ORDER BY effective_price_idr ASC
      LIMIT 1
    ) co ON true
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.countryCode) {
    params.push(filters.countryCode);
    sql += ` AND b.country_code = $${params.length}`;
  }
  if (filters?.season) {
    params.push(filters.season);
    sql += ` AND b.series_season = $${params.length}`;
  }
  if (filters?.month) {
    params.push(filters.month);
    sql += ` AND TO_CHAR(b.departure_date, 'YYYY-MM') = $${params.length}`;
  }
  if (filters?.status) {
    params.push(filters.status);
    sql += ` AND bss.effective_status = $${params.length}`;
  }

  sql += ` ORDER BY b.departure_date ASC`;

  const res = await query(sql, params);
  return res.rows;
}

export async function getPublicBatchBySlugs(seriesSlug: string, batchSlug: string) {
  const detailSql = `
    SELECT 
      b.*,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status
    FROM v_published_batch_detail b
    JOIN v_batch_seat_status bss ON bss.batch_id = b.batch_id
    WHERE b.series_slug = $1 AND b.batch_slug = $2
  `;
  const detailRes = await query(detailSql, [seriesSlug, batchSlug]);
  if (detailRes.rowCount === 0) return null;
  const batch = detailRes.rows[0];

  // Fetch itinerary days & activities
  const daysSql = `
    SELECT id, day_no, local_date, title, description, highlight_media_id
    FROM itinerary_days
    WHERE version_id = $1
    ORDER BY day_no ASC
  `;
  const daysRes = await query(daysSql, [batch.version_id]);

  for (const day of daysRes.rows) {
    const actSql = `
      SELECT id, sort_index, start_local_time, end_local_time, activity_type,
             title, details, location_name, is_optional, local_timezone
      FROM itinerary_activities
      WHERE itinerary_day_id = $1
      ORDER BY sort_index ASC
    `;
    const actRes = await query(actSql, [day.id]);
    day.activities = actRes.rows;
  }
  batch.days = daysRes.rows;

  // Fetch published price options
  const offersSql = `
    SELECT *
    FROM v_current_offers
    WHERE version_id = $1
    ORDER BY effective_price_idr ASC
  `;
  const offersRes = await query(offersSql, [batch.version_id]);
  batch.price_options = offersRes.rows;

  // Fetch other sibling batches for the switcher
  const siblingsSql = `
    SELECT 
      b.batch_code, b.batch_slug, b.departure_date, b.return_date,
      bss.effective_status
    FROM v_published_batch_detail b
    JOIN v_batch_seat_status bss ON bss.batch_id = b.batch_id
    WHERE b.trip_series_id = $1
    ORDER BY b.departure_date ASC
  `;
  const siblingsRes = await query(siblingsSql, [batch.trip_series_id]);
  batch.sibling_batches = siblingsRes.rows;

  return batch;
}

export async function getPublicDestinations() {
  const sql = `
    SELECT d.*, 
           COUNT(b.id) AS active_batches_count
    FROM destinations d
    LEFT JOIN trip_series ts ON ts.destination_id = d.id AND ts.publish_state = 'published'
    LEFT JOIN batches b ON b.trip_series_id = ts.id AND b.published_version_id IS NOT NULL
    WHERE d.is_active = true
    GROUP BY d.id
    ORDER BY d.sort_index ASC, d.name ASC
  `;
  const res = await query(sql);
  return res.rows;
}

export async function getPublicAdventures() {
  const sql = `
    SELECT 
      s.id, s.headline, s.story_text, s.credited_name, s.published_at,
      b.batch_code, b.departure_date, b.return_date,
      ts.name AS series_name, d.name AS destination_name
    FROM adventure_stories s
    JOIN batches b ON s.batch_id = b.id
    JOIN trip_series ts ON b.trip_series_id = ts.id
    JOIN destinations d ON ts.destination_id = d.id
    WHERE s.publish_state = 'published' AND s.consent_status = 'granted'
    ORDER BY s.published_at DESC
  `;
  const res = await query(sql);
  return res.rows;
}

export async function getSiteSettings(): Promise<Record<string, any>> {
  const res = await query(`SELECT key, value_json FROM site_settings`);
  const settings: Record<string, any> = {};
  for (const row of res.rows) {
    settings[row.key] = row.value_json;
  }
  return settings;
}

// ============================================================================
// ADMIN REVISION, CATALOG & PUBLISHING
// ============================================================================

export async function duplicateBatchDraft(sourceBatchId: string, newBatchCode: string, newDepartureDate: string, newReturnDate: string, adminId: string) {
  return await withTransaction(async (client) => {
    // 1. Fetch source batch
    const srcRes = await client.query(`SELECT * FROM batches WHERE id = $1`, [sourceBatchId]);
    if (srcRes.rowCount === 0) throw new Error('Source batch not found');
    const src = srcRes.rows[0];

    const newSlug = `${src.slug}-${newBatchCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;

    // 2. Insert new batch (PRD DEC-14 & §10.2: copies ONLY content config, NEVER bookings/seats/payments)
    const newBatchRes = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'coming_soon', $8, $9)
      RETURNING id`,
      [
        src.trip_series_id,
        newBatchCode,
        newSlug,
        newDepartureDate,
        newReturnDate,
        src.departure_timezone,
        src.capacity,
        src.show_exact_seats,
        src.limited_seats_threshold,
      ]
    );
    const newBatchId = newBatchRes.rows[0].id;

    // 3. Find source latest version to duplicate
    const verRes = await client.query(
      `SELECT * FROM batch_content_versions 
       WHERE batch_id = $1 
       ORDER BY revision_no DESC LIMIT 1`,
      [sourceBatchId]
    );

    if (verRes.rowCount! > 0) {
      const srcVer = verRes.rows[0];
      const newVerRes = await client.query(
        `INSERT INTO batch_content_versions (
          batch_id, revision_no, status, hero_media_id, title, lead, route_summary, departure_meeting_info, created_by_admin
        ) VALUES ($1, 1, 'draft', $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          newBatchId,
          srcVer.hero_media_id,
          srcVer.title,
          srcVer.lead,
          srcVer.route_summary,
          srcVer.departure_meeting_info,
          adminId,
        ]
      );
      const newVerId = newVerRes.rows[0].id;

      // Duplicate itinerary days & activities
      const daysRes = await client.query(`SELECT * FROM itinerary_days WHERE version_id = $1 ORDER BY day_no ASC`, [srcVer.id]);
      for (const day of daysRes.rows) {
        const newDayRes = await client.query(
          `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description, highlight_media_id)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [newVerId, day.day_no, day.local_date, day.title, day.description, day.highlight_media_id]
        );
        const newDayId = newDayRes.rows[0].id;

        const actRes = await client.query(`SELECT * FROM itinerary_activities WHERE itinerary_day_id = $1 ORDER BY sort_index ASC`, [day.id]);
        for (const act of actRes.rows) {
          await client.query(
            `INSERT INTO itinerary_activities (
              itinerary_day_id, sort_index, start_local_time, end_local_time, activity_type,
              title, details, location_name, location_lat, location_lng, is_optional, media_id, local_timezone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              newDayId, act.sort_index, act.start_local_time, act.end_local_time, act.activity_type,
              act.title, act.details, act.location_name, act.location_lat, act.location_lng,
              act.is_optional, act.media_id, act.local_timezone
            ]
          );
        }
      }

      // Duplicate price options
      const offersRes = await client.query(`SELECT * FROM price_options WHERE version_id = $1`, [srcVer.id]);
      for (const off of offersRes.rows) {
        await client.query(
          `INSERT INTO price_options (
            version_id, sku, display_name, package_type, room_type, list_price_idr,
            promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
            included_json, excluded_json, land_meeting_info, is_enabled
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            newVerId, off.sku, off.display_name, off.package_type, off.room_type, off.list_price_idr,
            off.promo_price_idr, off.promo_start_at, off.promo_end_at, off.dp_per_traveler_idr,
            off.included_json, off.excluded_json, off.land_meeting_info, off.is_enabled
          ]
        );
      }
    }

    await logAuditEvent(client, {
      adminUserId: adminId,
      entityType: 'batch',
      entityId: newBatchId,
      eventType: 'batch_duplicated',
      beforeJson: { sourceBatchId },
      afterJson: { newBatchId, newBatchCode, newDepartureDate },
    });

    return newBatchId;
  });
}

export async function publishBatchRevision(batchId: string, versionId: string, adminId: string) {
  return await withTransaction(async (client) => {
    // 1. Verify version belongs to batch
    const verRes = await client.query(
      `SELECT * FROM batch_content_versions WHERE id = $1 AND batch_id = $2 FOR UPDATE`,
      [versionId, batchId]
    );
    if (verRes.rowCount === 0) throw new Error('Versi konten tidak valid untuk batch ini');

    // 2. Mark previous published versions as archived
    await client.query(
      `UPDATE batch_content_versions 
       SET status = 'archived' 
       WHERE batch_id = $1 AND status = 'published'`,
      [batchId]
    );

    // 3. Mark target version as published
    await client.query(
      `UPDATE batch_content_versions 
       SET status = 'published', published_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [versionId]
    );

    // 4. Update pointer on batch atomically
    await client.query(
      `UPDATE batches 
       SET published_version_id = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [versionId, batchId]
    );

    await logAuditEvent(client, {
      adminUserId: adminId,
      entityType: 'batch',
      entityId: batchId,
      eventType: 'revision_published',
      afterJson: { publishedVersionId: versionId },
    });
  });
}

// ============================================================================
// ADMIN BOOKING, PAYMENTS & LEDGER
// ============================================================================

export async function createManualBooking(params: {
  batchId: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail?: string;
  source?: 'whatsapp' | 'referral' | 'manual';
  notesPrivate?: string;
  travelers: Array<{
    fullName: string;
    contactPhone?: string;
    priceOptionId: string;
  }>;
  adminId: string;
}) {
  return await withTransaction(async (client) => {
    // 1. Generate unique booking code
    const datePrefix = new Date().toISOString().slice(2, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `VWS-${datePrefix}-${randomSuffix}`;

    // 2. Insert booking row
    const bRes = await client.query(
      `INSERT INTO bookings (
        batch_id, booking_code, primary_contact_name, primary_contact_phone,
        primary_contact_email, status, source, notes_private, created_by_admin
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8)
      RETURNING id, booking_code`,
      [
        params.batchId,
        bookingCode,
        params.primaryContactName,
        params.primaryContactPhone,
        params.primaryContactEmail || null,
        params.source || 'whatsapp',
        params.notesPrivate || null,
        params.adminId,
      ]
    );
    const bookingId = bRes.rows[0].id;

    // 3. Insert travelers and snapshot commercial booking items
    let totalBookingCharge = 0;

    for (const t of params.travelers) {
      const tRes = await client.query(
        `INSERT INTO booking_travelers (booking_id, full_name, contact_phone, status)
         VALUES ($1, $2, $3, 'active')
         RETURNING id`,
        [bookingId, t.fullName, t.contactPhone || null]
      );
      const travelerId = tRes.rows[0].id;

      // Fetch price option snapshot
      const poRes = await client.query(`SELECT * FROM v_current_offers WHERE offer_id = $1`, [t.priceOptionId]);
      if (poRes.rowCount === 0) throw new Error(`Opsi paket ${t.priceOptionId} tidak ditemukan.`);
      const offer = poRes.rows[0];

      const agreedPrice = Number(offer.effective_price_idr);
      const agreedDp = Number(offer.dp_per_traveler_idr);
      totalBookingCharge += agreedPrice;

      const itemRes = await client.query(
        `INSERT INTO booking_items (
          booking_id, booking_traveler_id, price_option_id, offer_snapshot_json,
          agreed_price_idr, agreed_dp_idr, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'active')
        RETURNING id`,
        [
          bookingId,
          travelerId,
          t.priceOptionId,
          JSON.stringify(offer),
          agreedPrice,
          agreedDp,
        ]
      );
      const bookingItemId = itemRes.rows[0].id;

      // Post initial debit entry to ledger for this traveler obligation
      await postLedgerEntry(client, {
        bookingId,
        bookingItemId,
        direction: 'debit',
        amountIdr: agreedPrice,
        eventType: 'booking_charge',
        sourceKind: 'booking_item',
        sourceId: bookingItemId,
        postedBy: params.adminId,
      });
    }

    await logAuditEvent(client, {
      adminUserId: params.adminId,
      entityType: 'booking',
      entityId: bookingId,
      bookingId,
      eventType: 'booking_created',
      afterJson: {
        bookingCode,
        totalCharge: totalBookingCharge,
        travelersCount: params.travelers.length,
      },
    });

    return { bookingId, bookingCode, totalBookingCharge };
  });
}
