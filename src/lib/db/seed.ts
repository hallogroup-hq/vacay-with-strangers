import { pool } from './index';
import { hashPassword } from '../auth/session';

export async function seedDatabase() {
  console.log('[SEED] Starting database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Admin User
    const passwordHash = hashPassword('VWSAdmin2026Secure!');
    const adminRes = await client.query(
      `INSERT INTO admin_users (email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, 'VWS Administrator', 'owner', true)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      ['admin@vacaywithstrangers.com', passwordHash]
    );
    const adminId = adminRes.rows[0].id;
    console.log('[SEED] Admin user ready:', adminId);

    // 2. Destinations
    const destData = [
      { name: 'Japan', slug: 'japan', code: 'JP', summary: 'Dari panorama musim gugur pedesaan hingga keindahan salju Shirakawa-go.', sort: 1 },
      { name: 'China', slug: 'china', code: 'CN', summary: 'Pegunungan pilar Zhangjiajie dan keindahan kota air kuno Fenghuang.', sort: 2 },
      { name: 'Vietnam', slug: 'vietnam', code: 'VN', summary: 'Kabut mistis perbukitan Sapa dan panorama karst zamrud Ha Long Bay.', sort: 3 },
      { name: 'Kazakhstan', slug: 'kazakhstan', code: 'KZ', summary: 'Ngarai megah Charyn, danau tenggelam Kaindy, dan bentang alam Asia Tengah.', sort: 4 },
    ];

    const destMap = new Map<string, string>();
    for (const d of destData) {
      const dRes = await client.query(
        `INSERT INTO destinations (name, slug, country_code, summary, is_active, sort_index)
         VALUES ($1, $2, $3, $4, true, $5)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary
         RETURNING id`,
        [d.name, d.slug, d.code, d.summary, d.sort]
      );
      destMap.set(d.slug, dRes.rows[0].id);
    }
    const japanDestId = destMap.get('japan')!;
    const chinaDestId = destMap.get('china')!;
    const vietnamDestId = destMap.get('vietnam')!;
    const kazakhstanDestId = destMap.get('kazakhstan')!;

    // 3. Trip Series: Japan Autumn Countryside
    const autumnSeriesRes = await client.query(
      `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
       VALUES ($1, 'Japan Autumn Countryside', 'japan-autumn', 'Autumn 2026', 'Perjalanan 8 hari melintasi pesona dedaunan merah pegunungan dan sudut autentik Jepang.', 'published')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [japanDestId]
    );
    const autumnSeriesId = autumnSeriesRes.rows[0].id;

    // 4. Batch 01 Japan Autumn (7-14 November 2026)
    const autumnBatchRes = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, 'AUTUMN-01', 'batch-01-nov-2026', '2026-11-07', '2026-11-14', 'Asia/Jakarta', 12, 'open', true, 3)
      ON CONFLICT (slug) DO UPDATE SET booking_state = EXCLUDED.booking_state
      RETURNING id`,
      [autumnSeriesId]
    );
    const autumnBatchId = autumnBatchRes.rows[0].id;

    // 5. Japan Autumn Batch Content Version
    const autumnVerRes = await client.query(
      `INSERT INTO batch_content_versions (
        batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
      ) VALUES (
        $1, 1, 'published',
        'Japan Countryside Autumn Trip',
        'Jelajahi keindahan musim gugur pedesaan Jepang bersama circle baru. Dari rimbunnya Kamikochi, misteri Togakushi, kehangatan danau Suwa, hingga sudut chill Tokyo.',
        'Osaka · Nagoya · Gifu · Nagano · Tokyo',
        'Bandara Internasional Soekarno-Hatta Terminal 3 (WIB)',
        CURRENT_TIMESTAMP, $2
      )
      ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published', published_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [autumnBatchId, adminId]
    );
    const autumnVersionId = autumnVerRes.rows[0].id;
    await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [autumnVersionId, autumnBatchId]);

    // 6. Japan Autumn Itinerary Days
    const autumnDaysData = [
      {
        day_no: 1,
        date: '2026-11-07',
        title: 'Jakarta ke Osaka & Menuju Nagoya',
        desc: 'Penerbangan bersama dari Jakarta menuju Kansai (KIX). Menikmati makan malam kuliner lokal Osaka dan Shinkansen menuju Nagoya.',
        activities: [
          { time: '01:00', type: 'flight', title: 'Penerbangan Jakarta (CGK) ke Osaka (KIX)', loc: 'Soekarno-Hatta T3' },
          { time: '19:35', type: 'transport', title: 'Tiba di Kansai, Imigrasi & Bagasi', loc: 'Kansai Airport' },
          { time: '20:30', type: 'meal', title: 'Makan Malam Kuliner Lokal Osaka', loc: 'Osaka' },
          { time: '21:30', type: 'transport', title: 'Shinkansen Experience Osaka ke Nagoya', loc: 'Shin-Osaka Station' },
          { time: '22:30', type: 'general', title: 'Check-in Hotel & Istirahat di Nagoya', loc: 'Nagoya' },
        ],
      },
      {
        day_no: 2,
        date: '2026-11-08',
        title: 'Eksplorasi Gifu & Perjalanan ke Nagano',
        desc: 'One day trip private exploring kawasan bersejarah Gifu, sebelum melanjutkan perjalanan menuju Nagano.',
        activities: [
          { time: '08:30', type: 'transport', title: 'Perjalanan Nagoya ke Gifu', loc: 'Nagoya' },
          { time: '10:00', type: 'highlight', title: 'One Day Trip Exploring Gifu (Private Tour)', loc: 'Gifu' },
          { time: '16:30', type: 'transport', title: 'Perjalanan Menuju Nagano', loc: 'Nagano' },
          { time: '19:00', type: 'general', title: 'Check-in Hotel & Makan Malam di Nagano', loc: 'Nagano City' },
        ],
      },
      {
        day_no: 3,
        date: '2026-11-09',
        title: 'Hutan Pinus Togakushi & Menuju Matsumoto',
        desc: 'Menyusuri jalur sakral Togakushi Shrine dengan pepohonan cedar berusia ratusan tahun di tengah dedaunan gugur. Dilanjutkan menuju Matsumoto.',
        activities: [
          { time: '08:30', type: 'transport', title: 'Nagano ke Togakushi', loc: 'Nagano' },
          { time: '09:30', type: 'highlight', title: 'Exploring Togakushi Shrine & Forest Trail', loc: 'Togakushi' },
          { time: '15:00', type: 'transport', title: 'Perjalanan Nagano ke Matsumoto', loc: 'Matsumoto' },
          { time: '17:00', type: 'general', title: 'Check-in Hotel di Matsumoto (Menginap 3 Malam)', loc: 'Matsumoto' },
        ],
      },
      {
        day_no: 4,
        date: '2026-11-10',
        title: 'Azumino Cycling Experience & Daio Wasabi Farm',
        desc: 'Bersepeda santai menyusuri lembah pedesaan Azumino dengan latar pegunungan Alpen Jepang dan singgah di perkebunan wasabi alami terbesar.',
        activities: [
          { time: '09:00', type: 'transport', title: 'Matsumoto ke Azumino', loc: 'Azumino' },
          { time: '09:30', type: 'highlight', title: 'One Day Exploring Azumino with Bike (Cycling Experience)', loc: 'Azumino Countryside' },
          { time: '13:00', type: 'meal', title: 'Makan Siang & Menjelajahi Daio Wasabi Farm', loc: 'Daio Wasabi Farm' },
          { time: '16:30', type: 'general', title: 'Kembali ke Matsumoto & Free Time Kuliner', loc: 'Matsumoto' },
        ],
      },
      {
        day_no: 5,
        date: '2026-11-11',
        title: 'Kastil Gagak Matsumoto & Sunset Danau Suwa',
        desc: 'Mengunjungi kastil kayu tertua di Jepang yang megah, lalu menyaksikan golden hour sunset di tepi Danau Suwa.',
        activities: [
          { time: '09:00', type: 'highlight', title: 'Exploring Matsumoto Castle & Kastil Tua', loc: 'Matsumoto Castle' },
          { time: '13:30', type: 'transport', title: 'Matsumoto ke Danau Suwa', loc: 'Suwa' },
          { time: '15:00', type: 'highlight', title: 'Menikmati Sunset Spektakuler di Danau Suwa', loc: 'Suwa Lake' },
          { time: '18:30', type: 'general', title: 'Kembali ke Matsumoto & Rest', loc: 'Matsumoto' },
        ],
      },
      {
        day_no: 6,
        date: '2026-11-12',
        title: 'Lembah Alpine Kamikochi & Menuju Tokyo',
        desc: 'Menikmati panorama alam terbaik pegunungan Alpen Jepang di Kamikochi dengan air sungai kristal dan dedaunan emas, dilanjutkan perjalanan menuju ibukota Tokyo.',
        activities: [
          { time: '07:30', type: 'transport', title: 'Matsumoto ke Kamikochi', loc: 'Kamikochi' },
          { time: '09:00', type: 'highlight', title: 'Exploring Lembah Pegunungan Kamikochi & Jembatan Kappa', loc: 'Kamikochi National Park' },
          { time: '14:30', type: 'transport', title: 'Perjalanan Kamikochi ke Tokyo', loc: 'Tokyo' },
          { time: '19:00', type: 'general', title: 'Check-in Hotel Tokyo & Makan Malam Bersama', loc: 'Tokyo' },
        ],
      },
      {
        day_no: 7,
        date: '2026-11-13',
        title: 'Sudut Santai Tokyo, Cafe Hopping & Berburu Oleh-oleh',
        desc: 'Menjelajahi kawasan chill dan cafe unik di Tokyo, berburu cenderamata khas, dan menutup malam kebersamaan sebelum kepulangan.',
        activities: [
          { time: '10:00', type: 'highlight', title: 'Cafe Hopping & Cozy Spots Tokyo', loc: 'Shibuya & Nakameguro' },
          { time: '14:00', type: 'general', title: 'Free Time & Hunting Oleh-oleh', loc: 'Tokyo' },
          { time: '19:00', type: 'meal', title: 'Farewell Dinner Vacay With Strangers', loc: 'Tokyo' },
          { time: '21:00', type: 'general', title: 'Packing & Istirahat di Hotel', loc: 'Tokyo' },
        ],
      },
      {
        day_no: 8,
        date: '2026-11-14',
        title: 'Kepulangan Tokyo ke Jakarta',
        desc: 'Persiapan checkout dan perjalanan ke bandara untuk penerbangan kembali ke tanah air membawa cerita dan sahabat baru.',
        activities: [
          { time: '06:00', type: 'general', title: 'Checkout & Menuju Bandara Narita/Haneda', loc: 'Tokyo Airport' },
          { time: '09:30', type: 'flight', title: 'Penerbangan Kembali Tokyo menuju Jakarta', loc: 'Narita/Haneda' },
          { time: '19:00', type: 'general', title: 'Tiba di Jakarta & Sampai Jumpa di Trip Berikutnya!', loc: 'Soekarno-Hatta T3' },
        ],
      },
    ];

    await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [autumnVersionId]);
    for (const d of autumnDaysData) {
      const dayRes = await client.query(
        `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [autumnVersionId, d.day_no, d.date, d.title, d.desc]
      );
      const dayId = dayRes.rows[0].id;
      for (let i = 0; i < d.activities.length; i++) {
        const act = d.activities[i];
        await client.query(
          `INSERT INTO itinerary_activities (
            itinerary_day_id, sort_index, start_local_time, activity_type, title, location_name
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [dayId, i + 1, act.time, act.type, act.title, act.loc]
        );
      }
    }

    // 7. Japan Autumn Price Options
    const fullInclusions = [
      'Tiket Pesawat PP Jakarta - Osaka / Tokyo - Jakarta',
      'Hotel Bintang 3 atau setara (Twin/Triple Sharing)',
      'Transportasi Publik Lokal (Train & Bus Pass)',
      'Pengalaman Shinkansen Experience Osaka - Nagoya',
      'Cycling Experience di Azumino Countryside',
      'Makan 3x sehari sesuai jadwal itinerary',
      'Bagasi Check-in 30kg & Kabin 7kg',
      'Tour Leader VWS yang mendampingi sepanjang trip',
      'Dokumentasi Foto & Video Perjalanan (Content)',
    ];
    const fullExclusions = [
      'Pembuatan Paspor & Visa Jepang (bisa dibantu konsultasi)',
      'Asuransi Perjalanan Pribadi (disarankan)',
      'Pengeluaran Pribadi & Jajan di luar jadwal',
      'Tipping opsional untuk driver lokal',
    ];

    const autumnFullOffer = await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, is_enabled
      ) VALUES (
        $1, 'JPN-AUT-FULL', 'Full Package (Termasuk Pesawat PP)', 'full', 'sharing',
        24000000, 21000000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        dp_per_traveler_idr = EXCLUDED.dp_per_traveler_idr,
        included_json = EXCLUDED.included_json,
        excluded_json = EXCLUDED.excluded_json
      RETURNING id`,
      [autumnVersionId, JSON.stringify(fullInclusions), JSON.stringify(fullExclusions)]
    );
    const autumnFullOfferId = autumnFullOffer.rows[0].id;

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, land_meeting_info, is_enabled
      ) VALUES (
        $1, 'JPN-AUT-LAND', 'Land Tour Only (Bertemu di Osaka)', 'land_only', 'sharing',
        17500000, 15000000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, 'Kansai International Airport (KIX) atau Lobi Hotel di Osaka pada 7 November 2026', true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        dp_per_traveler_idr = EXCLUDED.dp_per_traveler_idr,
        included_json = EXCLUDED.included_json,
        excluded_json = EXCLUDED.excluded_json,
        land_meeting_info = EXCLUDED.land_meeting_info`,
      [autumnVersionId, JSON.stringify(fullInclusions.slice(1)), JSON.stringify(fullExclusions)]
    );

    // Installment Plan for Autumn
    const existingAutumnPlan = await client.query(
      `SELECT id FROM installment_plans WHERE price_option_id = $1 LIMIT 1`,
      [autumnFullOfferId]
    );
    let autumnPlanId: string;
    if (existingAutumnPlan.rowCount && existingAutumnPlan.rowCount > 0) {
      autumnPlanId = existingAutumnPlan.rows[0].id;
    } else {
      const autumnPlan = await client.query(
        `INSERT INTO installment_plans (
          price_option_id, name, is_official, dp_idr, terms_notes, is_enabled
        ) VALUES ($1, 'Skema Cicilan 10 Bulan (Promo Autumn)', true, 1500000, 'DP Rp 1.500.000 + 10x cicilan flat Rp 1.950.000/bulan (total Rp 21.000.000)', true)
        RETURNING id`,
        [autumnFullOfferId]
      );
      autumnPlanId = autumnPlan.rows[0].id;
    }

    await client.query(`DELETE FROM installment_plan_lines WHERE installment_plan_id = $1`, [autumnPlanId]);
    for (let m = 1; m <= 10; m++) {
      const monthStr = `2026-${String(m).padStart(2, '0')}-01`;
      await client.query(
        `INSERT INTO installment_plan_lines (installment_plan_id, period_month, amount_idr, sort_index)
         VALUES ($1, $2, 1950000, $3)`,
        [autumnPlanId, monthStr, m]
      );
    }

    // =========================================================================
    // 8. TRIP SERIES: Winter In Japan (Jan 9-14 2027) - From Visual/Winter Assets
    // =========================================================================
    const winterSeriesRes = await client.query(
      `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
       VALUES ($1, 'Winter In Japan', 'japan-winter', 'Winter 2027', 'Petualangan musim dingin melintasi desa salju Shirakawa-go, keindahan Kyoto, keseruan Osaka, dan gemerlap Tokyo.', 'published')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [japanDestId]
    );
    const winterSeriesId = winterSeriesRes.rows[0].id;

    const winterBatchRes = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, 'WINTER-01', 'batch-01-jan-2027', '2027-01-09', '2027-01-14', 'Asia/Jakarta', 11, 'open', true, 3)
      ON CONFLICT (slug) DO UPDATE SET booking_state = EXCLUDED.booking_state
      RETURNING id`,
      [winterSeriesId]
    );
    const winterBatchId = winterBatchRes.rows[0].id;

    const winterVerRes = await client.query(
      `INSERT INTO batch_content_versions (
        batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
      ) VALUES (
        $1, 1, 'published',
        'Winter In Japan Expedition (Shirakawa-go Edition)',
        'Rasakan dinginnya salju magis Shirakawa-go, meluncur di Tsutenkaku Tower Osaka, pesona kuil merah Fushimi Inari, hingga sudut malam Shibuya Tokyo.',
        'Osaka · Kyoto · Nagoya · Shirakawa-go · Tokyo',
        'Bandara Internasional Soekarno-Hatta Terminal 3 (WIB)',
        CURRENT_TIMESTAMP, $2
      )
      ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published', published_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [winterBatchId, adminId]
    );
    const winterVersionId = winterVerRes.rows[0].id;
    await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [winterVersionId, winterBatchId]);

    // Winter Itinerary (6 Days from Visual Onboarding Deck)
    const winterDays = [
      {
        day_no: 1, date: '2027-01-09', title: 'Jakarta ke Osaka via Manila',
        desc: 'Penerbangan bersama dari Jakarta menuju Osaka. Tiba di Bandara Kansai (KIX) malam hari, proses imigrasi dan menuju penginapan untuk istirahat.',
        activities: [
          { time: '01:20', type: 'flight', title: 'Flight CGK ke MNL (Transit)', loc: 'Soekarno-Hatta T3' },
          { time: '14:30', type: 'flight', title: 'Flight MNL ke KIX Osaka', loc: 'Manila Airport' },
          { time: '19:35', type: 'transport', title: 'Landing di Kansai International Airport', loc: 'Osaka KIX' },
          { time: '21:00', type: 'general', title: 'Check-in Akomodasi & Free Time Istirahat', loc: 'Osaka' },
        ],
      },
      {
        day_no: 2, date: '2027-01-10', title: 'Osaka Highlights & Dotonbori River Cruise',
        desc: 'Menjelajahi ikon Osaka: Tsutenkaku Tower & Tower Slider, berlayar dengan Santa Maria Cruise, kemegahan Osaka Castle, dan Dotonbori River Cruise di malam hari.',
        activities: [
          { time: '09:00', type: 'highlight', title: 'Tsutenkaku Tower & Tower Slider Experience', loc: 'Tsutenkaku Osaka' },
          { time: '12:30', type: 'highlight', title: 'Santa Maria Cruise Experience', loc: 'Osaka Bay' },
          { time: '15:20', type: 'highlight', title: 'Explore Megahnya Osaka Castle', loc: 'Osaka Castle' },
          { time: '17:20', type: 'highlight', title: 'Dotonbori River Cruise & Kuliner Malam', loc: 'Dotonbori' },
        ],
      },
      {
        day_no: 3, date: '2027-01-11', title: 'Kuil Fushimi Inari Kyoto & Menuju Nagoya',
        desc: 'Menyusuri seribu gerbang torii merah Fushimi Inari di Kyoto, jalan santai di Gion, lalu Shinkansen menuju Nagoya.',
        activities: [
          { time: '08:30', type: 'highlight', title: 'Explore Fushimi Inari Taisha (Thousand Torii)', loc: 'Kyoto' },
          { time: '11:00', type: 'highlight', title: 'Lunch & Strolling Around Gion District', loc: 'Kyoto Gion' },
          { time: '14:30', type: 'transport', title: 'Kereta Cepat Kyoto Menuju Nagoya', loc: 'Nagoya' },
          { time: '17:30', type: 'general', title: 'Osu Shotengai Shopping Street & Night Walk', loc: 'Nagoya' },
        ],
      },
      {
        day_no: 4, date: '2027-01-12', title: 'Desa Salju Shirakawa-go & Shogawa River Cruise',
        desc: 'Momen puncak musim dingin! Berjalan di desa tradisional beratap jerami tebal berselimut salju di Shirakawa-go dan Shogawa River Cruise sebelum perjalanan malam ke Tokyo.',
        activities: [
          { time: '08:40', type: 'highlight', title: 'Exploring Kota Bersejarah Gujo Hachiman', loc: 'Gujo' },
          { time: '11:00', type: 'highlight', title: 'Strolling Around Desa Salju Shirakawa-go', loc: 'Shirakawa-go' },
          { time: '14:30', type: 'highlight', title: 'Shogawa Winter River Cruise Experience', loc: 'Shogawa River' },
          { time: '23:00', type: 'transport', title: 'Overnight Trip Menuju Tokyo', loc: 'En Route Tokyo' },
        ],
      },
      {
        day_no: 5, date: '2027-01-13', title: 'Shibuya Crossing, Tokyo Tower & Roppongi',
        desc: 'Menikmati atmosfer megapolitan Tokyo: Shibuya Crossing legendaris, National Art Museum, dan pemandangan Tokyo Tower saat senja.',
        activities: [
          { time: '10:30', type: 'highlight', title: 'Shibuya Crossing Street & Hachiko Statue', loc: 'Shibuya Tokyo' },
          { time: '14:00', type: 'highlight', title: 'The National Art Center Tokyo', loc: 'Roppongi' },
          { time: '16:30', type: 'highlight', title: 'Tokyo Tower View & Golden Hour Roppongi', loc: 'Tokyo Tower' },
          { time: '19:00', type: 'meal', title: 'Farewell Dinner Circle VWS', loc: 'Tokyo' },
        ],
      },
      {
        day_no: 6, date: '2027-01-14', title: 'Sayonara Japan & Penerbangan Pulang',
        desc: 'Checkout hotel, perjalanan menuju Bandara Narita (NRT) dan penerbangan kembali ke Jakarta dengan sejuta kenangan.',
        activities: [
          { time: '06:00', type: 'general', title: 'Checkout & Transfer Bandara Narita', loc: 'Narita NRT' },
          { time: '09:30', type: 'flight', title: 'Penerbangan NRT ke CGK via Manila', loc: 'Flight' },
          { time: '23:55', type: 'general', title: 'Touchdown Jakarta dengan Sahabat Baru', loc: 'Soekarno-Hatta T3' },
        ],
      },
    ];

    await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [winterVersionId]);
    for (const d of winterDays) {
      const dayRes = await client.query(
        `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [winterVersionId, d.day_no, d.date, d.title, d.desc]
      );
      const dayId = dayRes.rows[0].id;
      for (let i = 0; i < d.activities.length; i++) {
        const act = d.activities[i];
        await client.query(
          `INSERT INTO itinerary_activities (
            itinerary_day_id, sort_index, start_local_time, activity_type, title, location_name
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [dayId, i + 1, act.time, act.type, act.title, act.loc]
        );
      }
    }

    // Winter Pricing (Strictly matching Visual/Winter assets: Promo Rp 18.999.000 vs Normal Rp 21.999.000)
    const winterFullOffer = await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, is_enabled
      ) VALUES (
        $1, 'JPN-WIN-FULL', 'Full Package (Termasuk Tiket Pesawat PP)', 'full', 'sharing',
        21999000, 18999000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        dp_per_traveler_idr = EXCLUDED.dp_per_traveler_idr,
        included_json = EXCLUDED.included_json,
        excluded_json = EXCLUDED.excluded_json
      RETURNING id`,
      [winterVersionId, JSON.stringify([
        'Tiket Pesawat PP Jakarta - Osaka / Tokyo - Jakarta',
        'Hotel Bintang 3 (Twin/Triple Sharing)',
        'Bagasi Check-in 30kg & Kabin 7kg',
        'Shirakawago & Shogawa River Cruise Pass',
        'Makan 3x sehari sesuai itinerary',
        'Tour Leader pendamping dari Jakarta',
        'Dokumentasi Foto & Video Profesional',
      ]), JSON.stringify(fullExclusions)]
    );
    const winterFullOfferId = winterFullOffer.rows[0].id;

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, land_meeting_info, is_enabled
      ) VALUES (
        $1, 'JPN-WIN-LAND', 'Land Tour Only (Meeting di Osaka)', 'land_only', 'sharing',
        15500000, 13500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, 'Kansai International Airport (KIX) Osaka pada 9 Januari 2027 pukul 20:00 JST', true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        dp_per_traveler_idr = EXCLUDED.dp_per_traveler_idr,
        included_json = EXCLUDED.included_json,
        excluded_json = EXCLUDED.excluded_json,
        land_meeting_info = EXCLUDED.land_meeting_info`,
      [winterVersionId, JSON.stringify([
        'Hotel Bintang 3 (Twin/Triple Sharing)',
        'Shirakawago & Shogawa River Cruise Pass',
        'Makan 3x sehari sesuai itinerary',
        'Tour Leader pendamping selama di Jepang',
        'Dokumentasi Foto & Video Profesional',
      ]), JSON.stringify(fullExclusions)]
    );

    // Winter Installment Plan Lines (Booking Seat 1.5M, Pelunasan DP 1M, 5x 3M, 1x 1.499M)
    const existingWinterPlan = await client.query(
      `SELECT id FROM installment_plans WHERE price_option_id = $1 LIMIT 1`,
      [winterFullOfferId]
    );
    let winterPlanId: string;
    if (existingWinterPlan.rowCount && existingWinterPlan.rowCount > 0) {
      winterPlanId = existingWinterPlan.rows[0].id;
    } else {
      const winterPlan = await client.query(
        `INSERT INTO installment_plans (
          price_option_id, name, is_official, dp_idr, terms_notes, is_enabled
        ) VALUES ($1, 'Skema Cicilan Winter (Promo)', true, 1500000, 'DP Booking Seat Rp 1.500.000 + Pelunasan DP Rp 1.000.000 + Cicilan bulanan flat', true)
        RETURNING id`,
        [winterFullOfferId]
      );
      winterPlanId = winterPlan.rows[0].id;
    }

    await client.query(`DELETE FROM installment_plan_lines WHERE installment_plan_id = $1`, [winterPlanId]);
    const winterPlanLines = [
      { month: '2026-07-01', amount: 3000000, idx: 1 },
      { month: '2026-08-01', amount: 3000000, idx: 2 },
      { month: '2026-09-01', amount: 3000000, idx: 3 },
      { month: '2026-10-01', amount: 3000000, idx: 4 },
      { month: '2026-11-01', amount: 3000000, idx: 5 },
      { month: '2026-12-01', amount: 1499000, idx: 6 },
    ];
    for (const pl of winterPlanLines) {
      await client.query(
        `INSERT INTO installment_plan_lines (installment_plan_id, period_month, amount_idr, sort_index)
         VALUES ($1, $2, $3, $4)`,
        [winterPlanId, pl.month, pl.amount, pl.idx]
      );
    }

    // =========================================================================
    // 9. OTHER DESTINATIONS & EDITIONS (Spring Japan, China, Vietnam, Kazakhstan)
    // =========================================================================
    const upcomingList = [
      {
        destId: japanDestId,
        seriesName: 'Japan Spring Cherry Blossom',
        seriesSlug: 'japan-spring',
        season: 'Spring 2027',
        batchCode: 'SAKURA-01',
        batchSlug: 'batch-01-apr-2027',
        depDate: '2027-03-28',
        retDate: '2027-04-04',
        capacity: 12,
        title: 'Japan Sakura & Spring Bloom',
        lead: 'Momen magis mekarnya bunga sakura di tepian Meguro River Tokyo, sudut tenang Arashiyama Kyoto, dan danau Kawaguchiko Fuji.',
        route: 'Tokyo · Meguro · Kyoto · Arashiyama · Fuji Kawaguchiko',
        sku: 'JPN-SPR-FULL',
        price: 23500000,
        listPrice: 26000000,
      },
      {
        destId: chinaDestId,
        seriesName: 'China: Avatar Mountains & Ancient Towns',
        seriesSlug: 'china-avatar',
        season: 'Spring 2027',
        batchCode: 'CHINA-01',
        batchSlug: 'batch-01-may-2027',
        depDate: '2027-05-10',
        retDate: '2027-05-17',
        capacity: 12,
        title: 'China Avatar Mountains & Fenghuang',
        lead: 'Menyusuri pilar batu megah Zhangjiajie yang menginspirasi dunia Avatar, jembatan kaca Tianmen Mountain, dan gemerlap kota kuno Fenghuang.',
        route: 'Changsha · Zhangjiajie National Park · Tianmen Mountain · Fenghuang',
        sku: 'CHN-AVA-FULL',
        price: 16800000,
        listPrice: 18500000,
      },
      {
        destId: vietnamDestId,
        seriesName: 'North Vietnam: Mist & Emerald Bays',
        seriesSlug: 'vietnam-north',
        season: 'Summer 2027',
        batchCode: 'VIET-01',
        batchSlug: 'batch-01-jun-2027',
        depDate: '2027-06-12',
        retDate: '2027-06-17',
        capacity: 12,
        title: 'North Vietnam Highlands & Ha Long Bay',
        lead: 'Mendaki atap Indochina di Fansipan Sapa, hamparan terasering hijau, dan bermalam di atas cruise mewah melintasi teluk karst Ha Long.',
        route: 'Hanoi · Sapa Terraces · Fansipan Peak · Ha Long Bay Cruise',
        sku: 'VTN-NOR-FULL',
        price: 11500000,
        listPrice: 13000000,
      },
      {
        destId: kazakhstanDestId,
        seriesName: 'Kazakhstan: Wild Steppes & Sunken Forests',
        seriesSlug: 'kazakhstan-expedition',
        season: 'Summer 2027',
        batchCode: 'KAZAKH-01',
        batchSlug: 'batch-01-jul-2027',
        depDate: '2027-07-05',
        retDate: '2027-07-12',
        capacity: 10,
        title: 'Kazakhstan Expedition & Sunken Lakes',
        lead: 'Menjelajahi keajaiban alam Asia Tengah: ngarai merah Charyn Canyon, danau pinus tenggelam Kaindy, dan kota budaya Almaty.',
        route: 'Almaty · Charyn Canyon · Kolsai Lakes · Kaindy Sunken Forest',
        sku: 'KAZ-EXP-FULL',
        price: 22000000,
        listPrice: 24500000,
      },
    ];

    for (const up of upcomingList) {
      const sRes = await client.query(
        `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
         VALUES ($1, $2, $3, $4, $5, 'published')
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [up.destId, up.seriesName, up.seriesSlug, up.season, up.lead]
      );
      const sId = sRes.rows[0].id;

      const bRes = await client.query(
        `INSERT INTO batches (
          trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
          capacity, booking_state, show_exact_seats, limited_seats_threshold
        ) VALUES ($1, $2, $3, $4, $5, 'Asia/Jakarta', $6, 'coming_soon', false, 3)
        ON CONFLICT (slug) DO UPDATE SET booking_state = EXCLUDED.booking_state
        RETURNING id`,
        [sId, up.batchCode, up.batchSlug, up.depDate, up.retDate, up.capacity]
      );
      const bId = bRes.rows[0].id;

      const vRes = await client.query(
        `INSERT INTO batch_content_versions (
          batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
        ) VALUES ($1, 1, 'published', $2, $3, $4, 'Bandara Soekarno-Hatta T3', CURRENT_TIMESTAMP, $5)
        ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published'
        RETURNING id`,
        [bId, up.title, up.lead, up.route, adminId]
      );
      const vId = vRes.rows[0].id;
      await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [vId, bId]);

      // Add Price Option
      await client.query(
        `INSERT INTO price_options (
          version_id, sku, display_name, package_type, room_type, list_price_idr,
          promo_price_idr, dp_per_traveler_idr, included_json, excluded_json, is_enabled
        ) VALUES ($1, $2, 'Full Package (Flight + Hotel + Land)', 'full', 'sharing', $3, $4, 1500000, $5, $6, true)
        ON CONFLICT (version_id, sku) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          list_price_idr = EXCLUDED.list_price_idr,
          promo_price_idr = EXCLUDED.promo_price_idr,
          dp_per_traveler_idr = EXCLUDED.dp_per_traveler_idr`,
        [vId, up.sku, up.listPrice, up.price, JSON.stringify(['Tiket Pesawat PP', 'Hotel Berbintang', 'Transportasi Lokal', 'Tour Leader']), JSON.stringify(fullExclusions)]
      );
    }

    // 10. Site Settings
    const settings = [
      { key: 'whatsapp_number', value: '6285774999875' },
      { key: 'site_title', value: 'Vacay With Strangers' },
      { key: 'site_tagline', value: 'Open-Trip Travel Club for Strangers' },
      { key: 'instagram_handle', value: '@vacaywithstrangers' },
    ];
    for (const s of settings) {
      await client.query(
        `INSERT INTO site_settings (key, value_json)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json`,
        [s.key, JSON.stringify(s.value)]
      );
    }

    // 11. Real Consented Past Adventure Story
    await client.query(
      `INSERT INTO adventure_stories (
        batch_id, headline, story_text, credited_name, consent_status, publish_state, published_at
      ) VALUES (
        $1,
        'Dari Orang Asing di Bandara Jadi Sahabat di Salju Shirakawago',
        'Awalnya canggung karena berangkat sendiri tanpa kenal siapa-siapa. Tapi begitu kumpul di terminal 3 dan sampai di Osaka, suasananya langsung cair. Pengalaman naik cruise di Shirakawago saat salju turun adalah momen paling magis.',
        'Sarah & Dimas',
        'granted',
        'published',
        CURRENT_TIMESTAMP - INTERVAL '30 days'
      ) ON CONFLICT DO NOTHING`,
      [autumnBatchId]
    );

    await client.query('COMMIT');
    console.log('[SEED] Multi-destination database seeding completed!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SEED] Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => {
      console.log('[SEED] Seed finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SEED] Fatal error in seed:', err);
      process.exit(1);
    });
}
