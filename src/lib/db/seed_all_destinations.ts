import { pool } from './index';

export async function seedAllDestinations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get Admin User ID
    const adminRes = await client.query(`SELECT id FROM admin_users LIMIT 1`);
    if (adminRes.rowCount === 0) {
      throw new Error('No admin user found. Run base seed first.');
    }
    const adminId = adminRes.rows[0].id;

    console.log('[SEED] Updating Destinations & Series for Yunnan, Vietnam (2 parts), and Central Asia (Kazakhstan & Kyrgyzstan)...');

    // 1. Ensure Destinations exist
    const destData = [
      { name: 'Japan', slug: 'japan', code: 'JP', summary: 'Dari panorama musim gugur pedesaan hingga keindahan salju Shirakawa-go.', sort: 1 },
      { name: 'China', slug: 'china', code: 'CN', summary: 'Eksplorasi provinsi Yunnan: keindahan Dali, kota kuno Lijiang, Gunung Salju Giok, hingga lembah spiritual Shangri-La.', sort: 2 },
      { name: 'Vietnam', slug: 'vietnam', code: 'VN', summary: 'Eksplorasi Vietnam terbagi dua: kabut mistis Sapa & Hanoi, serta pesona lampion Hoi An, Ba Na Hills & sejuknya Da Lat.', sort: 3 },
      { name: 'Kazakhstan & Kyrgyzstan', slug: 'kazakhstan', code: 'KZ', summary: 'Ekspedisi 2 negara Asia Tengah: ngarai Charyn, danau tenggelam Kaindy, danau mutiara Issyk-Kul, dan lembah gletser Ala Archa.', sort: 4 },
    ];

    const destMap = new Map<string, string>();
    for (const d of destData) {
      const dRes = await client.query(
        `INSERT INTO destinations (name, slug, country_code, summary, is_active, sort_index)
         VALUES ($1, $2, $3, $4, true, $5)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary, country_code = EXCLUDED.country_code
         RETURNING id`,
        [d.name, d.slug, d.code, d.summary, d.sort]
      );
      destMap.set(d.slug, dRes.rows[0].id);
    }

    const chinaDestId = destMap.get('china')!;
    const vietnamDestId = destMap.get('vietnam')!;
    const kazakhstanDestId = destMap.get('kazakhstan')!;

    // =========================================================================
    // 2. CHINA: Mystical Yunnan & Shangri-La (7 Days 6 Nights)
    // =========================================================================
    const chinaSeries = await client.query(
      `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
       VALUES ($1, 'China: Mystical Yunnan & Shangri-La', 'china-yunnan', 'Spring & Autumn 2027', 'Eksplorasi keindahan provinsi Yunnan: bersepeda di tepi Danau Erhai Dali, lorong berbatu Lijiang Ancient Town, kemegahan Jade Dragon Snow Mountain, dan lembah mistis Shangri-La.', 'published')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [chinaDestId]
    );
    const chinaSeriesId = chinaSeries.rows[0].id;

    const chinaBatch = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, 'YUNNAN-01', 'batch-01-may-2027', '2027-05-10', '2027-05-16', 'Asia/Jakarta', 12, 'open', true, 4)
      ON CONFLICT (slug) DO UPDATE SET booking_state = 'open', capacity = 12
      RETURNING id`,
      [chinaSeriesId]
    );
    const chinaBatchId = chinaBatch.rows[0].id;

    const chinaVer = await client.query(
      `INSERT INTO batch_content_versions (
        batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
      ) VALUES (
        $1, 1, 'published',
        'China: Mystical Yunnan & Shangri-La Expedition',
        'Jelajahi keajaiban provinsi Yunnan bersama circle baru. Dari hembusan angin danau Erhai Dali, lorong batu kota kuno Lijiang, kegagahan Gunung Salju Giok, hingga spiritualitas lembah Shangri-La.',
        'Kunming ➔ Dali ➔ Erhai Lake ➔ Lijiang ➔ Jade Dragon Snow Mountain ➔ Tiger Leaping Gorge ➔ Shangri-La',
        'Bandara Internasional Soekarno-Hatta Terminal 3 (WIB)',
        CURRENT_TIMESTAMP, $2
      )
      ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published', published_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [chinaBatchId, adminId]
    );
    const chinaVersionId = chinaVer.rows[0].id;
    await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [chinaVersionId, chinaBatchId]);

    // China Yunnan Itinerary (7 Days)
    const chinaDays = [
      {
        day_no: 1, date: '2027-05-10', title: 'Jakarta ke Kunming & Bullet Train to Dali',
        desc: 'Penerbangan dari Jakarta menuju Kunming (Spring City). Menyantap hidangan lokal Crossing-the-Bridge Rice Noodles, lalu menaiki kereta cepat berkecepatan tinggi menuju kota romantis Dali.',
        activities: [
          { time: '08:00', type: 'flight', title: 'Penerbangan Jakarta (CGK) menuju Kunming (KMG)', loc: 'Soekarno-Hatta T3' },
          { time: '14:30', type: 'transport', title: 'Landing di Kunming Changshui Airport & Imigrasi', loc: 'Kunming Airport' },
          { time: '16:00', type: 'meal', title: 'Makan Siang Otentik Yunnan Crossing-the-Bridge Noodles', loc: 'Kunming City' },
          { time: '17:30', type: 'transport', title: 'High-Speed Bullet Train Kunming ke Dali (2 Jam)', loc: 'Kunming Station' },
          { time: '20:00', type: 'general', title: 'Check-in Guesthouse Khas Bai di Dali & Istirahat', loc: 'Dali Ancient Town' },
        ],
      },
      {
        day_no: 2, date: '2027-05-11', title: 'Dali Ancient Town & Erhai Lake Cycling',
        desc: 'Menjelajahi Three Pagodas Chongsheng yang ikonik, bersepeda santai di jalur pesisir danau Erhai dengan latar Gunung Cangshan, dan nongkrong sore di kafe desa Xizhou.',
        activities: [
          { time: '09:00', type: 'highlight', title: 'Exploring Dali Ancient Town & Gerbang Bersejarah', loc: 'Dali Ancient Town' },
          { time: '11:00', type: 'highlight', title: 'Kunjungan Ikonik Tiga Pagoda (Three Pagodas)', loc: 'Chongsheng Temple' },
          { time: '13:30', type: 'highlight', title: 'Erhai Lake Scenic Cycling Experience', loc: 'Erhai Lake' },
          { time: '16:30', type: 'general', title: 'Menikmati Kue Bunga Mawar & Kopi di Desa Xizhou', loc: 'Xizhou Town' },
          { time: '19:00', type: 'meal', title: 'Makan Malam Kuliner Etnis Minoritas Bai', loc: 'Dali' },
        ],
      },
      {
        day_no: 3, date: '2027-05-12', title: 'Dali ke Lijiang & Dayan UNESCO Ancient Town',
        desc: 'Perjalanan darat panorama menuju Lijiang (2.400 mdpl). Menelusuri kanal air berbatu Dayan Ancient Town yang bebas kendaraan bermotor, menyusuri Sifang Street, dan sunset di Wangu Tower.',
        activities: [
          { time: '09:00', type: 'transport', title: 'Scenic Drive Dali menuju Kota Lijiang', loc: 'En Route Lijiang' },
          { time: '12:00', type: 'general', title: 'Check-in Penginapan Tradisional Naxi Courtyard', loc: 'Lijiang Ancient Town' },
          { time: '14:00', type: 'highlight', title: 'Exploring Dayan Ancient Town & Jembatan Kuno', loc: 'Dayan Town' },
          { time: '17:00', type: 'highlight', title: 'Sunset Panoramik Lijiang dari Puncak Lion Hill', loc: 'Wangu Tower' },
          { time: '19:30', type: 'meal', title: 'Makan Malam Naxi Ribs Casserole Hotpot', loc: 'Lijiang' },
        ],
      },
      {
        day_no: 4, date: '2027-05-13', title: 'Jade Dragon Snow Mountain & Blue Moon Valley',
        desc: 'Hari penuh keajaiban alam! Menaiki cable car menuju Glacier Park Gunung Salju Giok (4.506 mdpl), trekking di Danau Pirus Blue Moon Valley (Baishui River), dan teater alam terbuka Impression Lijiang.',
        activities: [
          { time: '07:30', type: 'transport', title: 'Menuju Kawasan Konservasi Jade Dragon Snow Mountain', loc: 'Yulong Mountain' },
          { time: '09:00', type: 'highlight', title: 'Cable Car Ride ke Glacier Park (Ketinggian 4.506m)', loc: 'Glacier Park' },
          { time: '12:30', type: 'highlight', title: 'Menyaksikan Pertunjukan Kolosal Impression Lijiang', loc: 'Outdoor Stage' },
          { time: '14:30', type: 'highlight', title: 'Trekking Danau Biru Kristal Blue Moon Valley', loc: 'Baishui River' },
          { time: '18:00', type: 'general', title: 'Kembali ke Lijiang & Waktu Santai Belanja Teh Pu-erh', loc: 'Lijiang' },
        ],
      },
      {
        day_no: 5, date: '2027-05-14', title: 'Tiger Leaping Gorge & Masuk Lembah Shangri-La',
        desc: 'Menyaksikan gemuruh dahsyat Sungai Jinsha di salah satu ngarai terdalam di dunia (Tiger Leaping Gorge). Dilanjutkan mendaki dataran tinggi Tibet menuju Shangri-La (Zhongdian 3.200 mdpl).',
        activities: [
          { time: '08:30', type: 'transport', title: 'Perjalanan Spektakuler ke Tiger Leaping Gorge', loc: 'Hutiao Gorge' },
          { time: '10:30', type: 'highlight', title: 'Trekking Ngarai Raksasa & Batu Harimau Melompat', loc: 'Tiger Leaping Gorge' },
          { time: '13:00', type: 'meal', title: 'Makan Siang View Ngarai di Tina\'s Guesthouse', loc: 'Gorge View' },
          { time: '15:00', type: 'transport', title: 'Perjalanan Masuk Dataran Tinggi Shangri-La', loc: 'Shangri-La' },
          { time: '17:30', type: 'highlight', title: 'Memutar Giant Prayer Wheel di Dukezong Ancient Town', loc: 'Guishan Park' },
          { time: '19:30', type: 'meal', title: 'Makan Malam Daging Yak Khas Tibet & Butter Tea', loc: 'Dukezong' },
        ],
      },
      {
        day_no: 6, date: '2027-05-15', title: 'Songzanlin Tibetan Monastery & Padang Napa Lake',
        desc: 'Menjelajahi biara Buddha Tibet terbesar di Yunnan, Songzanlin Monastery yang dijuluki "Potala Palace Kecil", dilanjutkan ke padang rumput dan danau musiman Napa Hai.',
        activities: [
          { time: '09:00', type: 'highlight', title: 'Kunjungan Spiritual Songzanlin Tibetan Monastery', loc: 'Songzanlin Monastery' },
          { time: '13:00', type: 'meal', title: 'Makan Siang Roti Tibet & Sup Jamur Liar Yunnan', loc: 'Shangri-La' },
          { time: '14:30', type: 'highlight', title: 'Menunggang Kuda & Menikmati Padang Rumput Napa Hai', loc: 'Napa Lake' },
          { time: '18:00', type: 'general', title: 'Malam Penutupan Circle & Cerita Sepanjang Perjalanan', loc: 'Shangri-La' },
        ],
      },
      {
        day_no: 7, date: '2027-05-16', title: 'Diqing Shangri-La Airport & Kembali ke Jakarta',
        desc: 'Sarapan hangat khas dataran tinggi, berpamitan dengan circle baru, dan transfer menuju bandara untuk penerbangan kembali ke Jakarta.',
        activities: [
          { time: '08:00', type: 'general', title: 'Sarapan Akhir & Packing Kenang-kenangan', loc: 'Hotel Shangri-La' },
          { time: '10:00', type: 'transport', title: 'Transfer ke Diqing Shangri-La Airport (DIG)', loc: 'Diqing Airport' },
          { time: '12:30', type: 'flight', title: 'Penerbangan Pulang Menuju Jakarta (Transit)', loc: 'En Route Jakarta' },
          { time: '21:30', type: 'general', title: 'Touchdown Jakarta dengan Sahabat Baru Seumur Hidup!', loc: 'Soekarno-Hatta T3' },
        ],
      },
    ];

    await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [chinaVersionId]);
    for (const d of chinaDays) {
      const dayRes = await client.query(
        `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [chinaVersionId, d.day_no, d.date, d.title, d.desc]
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

    // China Price Options
    const chinaFullInc = [
      'Tiket Pesawat Internasional PP Jakarta - Kunming / Shangri-La - Jakarta',
      'High-Speed Bullet Train Kunming ke Dali (Second Class Seat)',
      'Transportasi Privat Ber-AC selama di Dali, Lijiang & Shangri-La',
      'Akomodasi Hotel 3★ / Traditional Courtyard Boutique Hotel (Twin Sharing)',
      'Tiket Masuk & Cable Car Glacier Park Jade Dragon Snow Mountain',
      'Tiket Masuk Blue Moon Valley & Pertunjukan Impression Lijiang',
      'Tiket Masuk Tiger Leaping Gorge & Songzanlin Monastery',
      'Makan 3x sehari sesuai itinerary (Kuliner Otentik Yunnan & Tibet)',
      'Tour Leader VWS Berpengalaman & Local Tibetan/Naxi Guide',
      'Dokumentasi Foto & Video Perjalanan Kualitas Tinggi',
    ];
    const chinaExclusions = [
      'Biaya Pembuatan Paspor & Visa China (bisa dibantu konsultasi)',
      'Asuransi Perjalanan Pribadi (disarankan)',
      'Pengeluaran Pribadi & Jajan di luar jadwal',
      'Tipping untuk Supir Lokal & Local Guide',
    ];

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, is_enabled
      ) VALUES (
        $1, 'CHN-YUN-FULL', 'Full Package (Termasuk Tiket Pesawat PP)', 'full', 'sharing',
        21000000, 18500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        included_json = EXCLUDED.included_json,
        excluded_json = EXCLUDED.excluded_json`,
      [chinaVersionId, JSON.stringify(chinaFullInc), JSON.stringify(chinaExclusions)]
    );

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, land_meeting_info, is_enabled
      ) VALUES (
        $1, 'CHN-YUN-LAND', 'Land Tour Only (Bertemu di Kunming)', 'land_only', 'sharing',
        14500000, 12500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, 'Kunming Changshui Airport (KMG) atau Stasiun Kereta Kunming pada 10 Mei 2027 pukul 14:00', true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        land_meeting_info = EXCLUDED.land_meeting_info`,
      [chinaVersionId, JSON.stringify(chinaFullInc.slice(1)), JSON.stringify(chinaExclusions)]
    );

    // =========================================================================
    // 3. VIETNAM PART 1: North Vietnam — Hanoi & Misty Sapa (6 Days 5 Nights)
    // =========================================================================
    const vietNorthSeries = await client.query(
      `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
       VALUES ($1, 'North Vietnam: Hanoi & Misty Sapa', 'vietnam-hanoi-sapa', 'Spring 2027', 'Eksplorasi Vietnam Utara: kabut sejuk dataran tinggi Sapa, menaklukkan atap Indochina Fansipan 3.143m, sawah terasering Muong Hoa, dan perahu karst Trang An Ninh Binh.', 'published')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [vietnamDestId]
    );
    const vietNorthSeriesId = vietNorthSeries.rows[0].id;

    const vietNorthBatch = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, 'HANOI-01', 'batch-01-hanoi-apr-2027', '2027-04-12', '2027-04-17', 'Asia/Jakarta', 12, 'open', true, 5)
      ON CONFLICT (slug) DO UPDATE SET booking_state = 'open', capacity = 12
      RETURNING id`,
      [vietNorthSeriesId]
    );
    const vietNorthBatchId = vietNorthBatch.rows[0].id;

    const vietNorthVer = await client.query(
      `INSERT INTO batch_content_versions (
        batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
      ) VALUES (
        $1, 1, 'published',
        'North Vietnam: Hanoi, Misty Sapa & Trang An',
        'Menikmati kabut sejuk pegunungan Sapa, menaklukkan puncak tertinggi Indochina di Fansipan, menyusuri sawah terasering Muong Hoa, dan berperahu di tebing karst megah Trang An Ninh Binh.',
        'Hanoi ➔ Sapa ➔ Fansipan Peak ➔ Cat Cat Village ➔ Muong Hoa Valley ➔ Ninh Binh ➔ Hanoi',
        'Bandara Internasional Soekarno-Hatta Terminal 3 (WIB)',
        CURRENT_TIMESTAMP, $2
      )
      ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published'
      RETURNING id`,
      [vietNorthBatchId, adminId]
    );
    const vietNorthVersionId = vietNorthVer.rows[0].id;
    await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [vietNorthVersionId, vietNorthBatchId]);

    // Hanoi-Sapa Itinerary (6 Days)
    const vietNorthDays = [
      {
        day_no: 1, date: '2027-04-12', title: 'Landing di Hanoi & Sleeper Bus Limousine to Sapa',
        desc: 'Penerbangan dari Jakarta ke Hanoi. Bertemu dengan circle, mencicipi Pho Ga otentik pertama, lalu menaiki bus sleeper mewah menuju pegunungan Sapa.',
        activities: [
          { time: '09:00', type: 'flight', title: 'Penerbangan Jakarta ke Hanoi Noi Bai Airport', loc: 'Noi Bai Airport' },
          { time: '13:30', type: 'meal', title: 'Makan Siang Pho Hang Non Otentik di Hanoi', loc: 'Hanoi' },
          { time: '15:00', type: 'transport', title: 'Cabin Sleeper Bus Limousine Menuju Sapa Highlands (5 Jam)', loc: 'Highway Hanoi-Lao Cai' },
          { time: '20:30', type: 'general', title: 'Check-in Hotel Berpanorama Lembah di Sapa & Hotpot Salmon', loc: 'Sapa Town' },
        ],
      },
      {
        day_no: 2, date: '2027-04-13', title: 'Fansipan Legend Peak (3.143m) & Cat Cat Village',
        desc: 'Menaiki kereta gantung terpanjang melintasi lautan awan menuju Atap Indochina di puncak Fansipan. Sore hari menyusuri jembatan gantung dan kincir air di Desa Cat Cat.',
        activities: [
          { time: '08:30', type: 'highlight', title: 'Muong Hoa Mountain Funicular Train', loc: 'Sun World Sapa' },
          { time: '09:30', type: 'highlight', title: 'Cable Car & Summit Trekking Fansipan Peak (3.143m)', loc: 'Fansipan Summit' },
          { time: '13:00', type: 'meal', title: 'Makan Siang Buffet di Restoran Lereng Awan', loc: 'Fansipan Legend' },
          { time: '15:00', type: 'highlight', title: 'Menjelajahi Air Terjun & Desa Etnis Hmong Cat Cat', loc: 'Cat Cat Village' },
          { time: '19:00', type: 'general', title: 'Sapa Night Market & BBQ Daging Gulung Sayur', loc: 'Sapa Square' },
        ],
      },
      {
        day_no: 3, date: '2027-04-14', title: 'Muong Hoa Valley Trekking & Transfer Back to Hanoi',
        desc: 'Trekking santai di antara terasering sawah hijau bertingkat di lembah Muong Hoa, berinteraksi dengan warga desa Ta Van, lalu kembali ke ibukota Hanoi.',
        activities: [
          { time: '08:30', type: 'highlight', title: 'Trekking Ringan Lembah Terasering Muong Hoa & Ta Van', loc: 'Muong Hoa Valley' },
          { time: '12:00', type: 'meal', title: 'Ngopi Santai Vietnam Drip di Kafe Tepi Tebing', loc: 'Valley Cafe' },
          { time: '14:00', type: 'transport', title: 'Perjalanan Nyaman Kembali ke Hanoi dengan Bus Limousine', loc: 'En Route Hanoi' },
          { time: '19:30', type: 'general', title: 'Check-in Hotel di Old Quarter Hanoi & Jalan Malam', loc: 'Hanoi Old Quarter' },
        ],
      },
      {
        day_no: 4, date: '2027-04-15', title: 'Day Trip to Ninh Binh: Trang An Karst & Mua Cave',
        desc: 'Menjelajahi "Ha Long Bay di Atas Daratan" di Ninh Binh. Berperahu dayung bambu menyusuri gua air Trang An dan mendaki Hang Mua Peak untuk melihat panorama lembah naga.',
        activities: [
          { time: '08:00', type: 'transport', title: 'Perjalanan 2 Jam Hanoi ke Kawasan Ninh Binh', loc: 'Ninh Binh' },
          { time: '10:00', type: 'highlight', title: 'Trang An UNESCO Boat Trip Menyusuri Terowongan Karst', loc: 'Trang An' },
          { time: '13:00', type: 'meal', title: 'Makan Siang Kambing Panggang & Nasi Kerak Ninh Binh', loc: 'Local Resto' },
          { time: '14:30', type: 'highlight', title: 'Mendaki 500 Anak Tangga Hang Mua & Patung Naga', loc: 'Mua Cave Peak' },
          { time: '17:30', type: 'transport', title: 'Kembali Menuju Hanoi', loc: 'Hanoi' },
        ],
      },
      {
        day_no: 5, date: '2027-04-16', title: 'Hanoi Train Street & Street Food Culinary Trail',
        desc: 'Menikmati sensasi ngopi telur (Egg Coffee) di pinggir rel legendaris Hanoi Train Street saat kereta melintas beberapa inci di depan mata, Danau Hoan Kiem, dan kulineran Bun Cha.',
        activities: [
          { time: '09:00', type: 'highlight', title: 'Kunjungan Danau Hoan Kiem & Jembatan Merah The Huc', loc: 'Hoan Kiem Lake' },
          { time: '11:00', type: 'highlight', title: 'Hanoi Train Street Experience & Egg Coffee di Cafe Giang', loc: 'Train Street' },
          { time: '13:00', type: 'meal', title: 'Makan Siang Bun Cha Otentik (Favorit Anthony Bourdain)', loc: 'Bun Cha Huong Lien' },
          { time: '15:30', type: 'general', title: 'Waktu Bebas Belanja Kopi Vietnam & Sutra di Dong Xuan Market', loc: 'Dong Xuan Market' },
          { time: '19:00', type: 'meal', title: 'Makan Malam Perpisahan Circle di Restoran Rooftop', loc: 'Hanoi Rooftop' },
        ],
      },
      {
        day_no: 6, date: '2027-04-17', title: 'St. Joseph Cathedral, Packing & Flight to Jakarta',
        desc: 'Jalan santai pagi di depan Katedral St. Joseph bergaya gotik kolonial Prancis, checkout hotel, dan transfer menuju bandara untuk penerbangan pulang ke Jakarta.',
        activities: [
          { time: '09:00', type: 'highlight', title: 'Foto di Depan Katedral St. Joseph & Sarapan Banh Mi', loc: 'French Quarter' },
          { time: '11:30', type: 'transport', title: 'Transfer ke Bandara Internasional Noi Bai', loc: 'Noi Bai Airport' },
          { time: '14:00', type: 'flight', title: 'Penerbangan Hanoi menuju Jakarta (CGK)', loc: 'En Route Jakarta' },
          { time: '18:30', type: 'general', title: 'Tiba di Jakarta dengan Sejuta Cerita Baru!', loc: 'Soekarno-Hatta T3' },
        ],
      },
    ];

    await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [vietNorthVersionId]);
    for (const d of vietNorthDays) {
      const dayRes = await client.query(
        `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [vietNorthVersionId, d.day_no, d.date, d.title, d.desc]
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

    // Vietnam North Price Options
    const vietNorthFullInc = [
      'Tiket Pesawat Internasional PP Jakarta - Hanoi - Jakarta',
      'Cabin Sleeper Bus Limousine Mewah Hanoi - Sapa PP',
      'Transportasi Privat Ber-AC untuk Day Trip Ninh Binh & City Tour',
      'Akomodasi Hotel 3★ di Sapa (View Lembah) & Hanoi Old Quarter (Twin Sharing)',
      'Tiket Funicular & Cable Car Sun World Fansipan Legend PP',
      'Tiket Masuk Cat Cat Village & Muong Hoa Valley',
      'Tiket Perahu Dayung Trang An UNESCO Karst & Hang Mua Peak',
      'Makan sesuai jadwal itinerary (Kuliner Otentik Vietnam)',
      'Tour Leader VWS yang mendampingi sepanjang perjalanan',
      'Dokumentasi Foto & Video Perjalanan Keren',
    ];
    const vietExclusions = [
      'Asuransi Perjalanan Pribadi (disarankan)',
      'Pengeluaran Pribadi & Belanja di luar jadwal',
      'Tipping untuk Supir & Boat Rower di Trang An',
    ];

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, is_enabled
      ) VALUES (
        $1, 'VTN-HAN-FULL', 'Full Package (Termasuk Pesawat PP)', 'full', 'sharing',
        13500000, 11500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr`,
      [vietNorthVersionId, JSON.stringify(vietNorthFullInc), JSON.stringify(vietExclusions)]
    );

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, land_meeting_info, is_enabled
      ) VALUES (
        $1, 'VTN-HAN-LAND', 'Land Tour Only (Bertemu di Hanoi)', 'land_only', 'sharing',
        9000000, 7500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, 'Noi Bai International Airport (HAN) Hanoi pada 12 April 2027 pukul 13:00', true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        land_meeting_info = EXCLUDED.land_meeting_info`,
      [vietNorthVersionId, JSON.stringify(vietNorthFullInc.slice(1)), JSON.stringify(vietExclusions)]
    );

    // =========================================================================
    // 4. VIETNAM PART 2: Central & Highlands — Da Nang, Hoi An & Da Lat (6 Days 5 Nights)
    // =========================================================================
    const vietSouthSeries = await client.query(
      `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
       VALUES ($1, 'Vietnam Central & Highlands: Da Nang, Hoi An & Da Lat', 'vietnam-danang-dalat', 'Summer 2027', 'Menjelajahi jembatan tangan emas Ba Na Hills, gemerlap lampion kota kuno Hoi An, naik perahu kelapa, dan berburu lautan awan di kota sejuk pegunungan Da Lat.', 'published')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [vietnamDestId]
    );
    const vietSouthSeriesId = vietSouthSeries.rows[0].id;

    const vietSouthBatch = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, 'DANANG-01', 'batch-01-jun-2027', '2027-06-15', '2027-06-20', 'Asia/Jakarta', 12, 'open', true, 5)
      ON CONFLICT (slug) DO UPDATE SET booking_state = 'open', capacity = 12
      RETURNING id`,
      [vietSouthSeriesId]
    );
    const vietSouthBatchId = vietSouthBatch.rows[0].id;

    const vietSouthVer = await client.query(
      `INSERT INTO batch_content_versions (
        batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
      ) VALUES (
        $1, 1, 'published',
        'Vietnam Central & Highlands: Da Nang, Hoi An & Da Lat',
        'Kombinasi sempurna pesona jembatan tangan emas Ba Na Hills, gemerlap lampion kota kuno Hoi An, perahu tempurung kelapa berputar, dan udara sejuk pegunungan Da Lat bertabur bunga pinus.',
        'Da Nang ➔ Ba Na Hills Golden Bridge ➔ Hoi An Lantern Ancient Town ➔ Coconut Basket Boat ➔ Da Lat Alpine Highlands',
        'Bandara Internasional Soekarno-Hatta Terminal 3 (WIB)',
        CURRENT_TIMESTAMP, $2
      )
      ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published'
      RETURNING id`,
      [vietSouthBatchId, adminId]
    );
    const vietSouthVersionId = vietSouthVer.rows[0].id;
    await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [vietSouthVersionId, vietSouthBatchId]);

    // Da Nang & Da Lat Itinerary (6 Days)
    const vietSouthDays = [
      {
        day_no: 1, date: '2027-06-15', title: 'Landing di Da Nang & Sunset di Pantai My Khe',
        desc: 'Penerbangan dari Jakarta ke Da Nang. Menyaksikan matahari terbenam di pantai pasir putih My Khe dan pertunjukan api naga Dragon Bridge di tepi Sungai Han.',
        activities: [
          { time: '10:00', type: 'flight', title: 'Penerbangan Jakarta menuju Da Nang (DAD)', loc: 'Da Nang Airport' },
          { time: '14:30', type: 'general', title: 'Check-in Hotel di Tepi Pantai Da Nang', loc: 'Da Nang' },
          { time: '16:30', type: 'highlight', title: 'Jalan Santai Sunset di Pantai My Khe', loc: 'My Khe Beach' },
          { time: '19:00', type: 'meal', title: 'Makan Malam Seafood Segar di Pinggir Laut Da Nang', loc: 'Seafood Resto' },
          { time: '21:00', type: 'highlight', title: 'Menyaksikan Fire-Breathing Show di Dragon Bridge', loc: 'Dragon Bridge' },
        ],
      },
      {
        day_no: 2, date: '2027-06-16', title: 'Sun World Ba Na Hills & The Golden Bridge',
        desc: 'Menaiki kereta gantung terpanjang menuju Sun World Ba Na Hills di puncak bukit berkabut. Berjalan di atas Golden Bridge yang dipegang sepasang tangan batu raksasa.',
        activities: [
          { time: '08:30', type: 'transport', title: 'Menuju Kawasan Wisata Ba Na Hills', loc: 'Ba Na Hills' },
          { time: '09:30', type: 'highlight', title: 'Menyeberangi Golden Bridge (Jembatan Tangan Emas)', loc: 'Golden Bridge' },
          { time: '11:30', type: 'highlight', title: 'Menjelajahi Kastil French Village & Le Jardin D\'Amour', loc: 'French Village' },
          { time: '13:00', type: 'meal', title: 'Makan Siang Buffet Mewah di Restoran Arabesque', loc: 'Ba Na Hills' },
          { time: '15:00', type: 'highlight', title: 'Serunya Meluncur di Wahana Alpine Coaster', loc: 'Alpine Coaster' },
          { time: '17:30', type: 'transport', title: 'Kembali ke Da Nang untuk Istirahat', loc: 'Da Nang' },
        ],
      },
      {
        day_no: 3, date: '2027-06-17', title: 'Cam Thanh Coconut Boat & Gemerlap Lampion Hoi An',
        desc: 'Sensasi mendayung perahu tempurung kelapa berputar yang asyik di hutan bakau Cam Thanh, dilanjutkan sore hingga malam magis di kota kuno Hoi An yang dihiasi ribuan lampion warna-warni.',
        activities: [
          { time: '09:00', type: 'transport', title: 'Perjalanan Menuju Hutan Kelapa Cam Thanh', loc: 'Cam Thanh' },
          { time: '10:00', type: 'highlight', title: 'Basket Boat Riding & Atraksi Perahu Berputar', loc: 'Coconut Village' },
          { time: '12:30', type: 'meal', title: 'Makan Siang Mi Cao Lau Khas Hoi An', loc: 'Hoi An' },
          { time: '14:30', type: 'highlight', title: 'Exploring Hoi An Ancient Town (UNESCO Heritage)', loc: 'Hoi An' },
          { time: '18:30', type: 'highlight', title: 'Naik Perahu & Melepas Lampion Lilin di Sungai Hoai', loc: 'Hoai River' },
          { time: '20:30', type: 'general', title: 'Hoi An Night Market & Kuliner Street Food', loc: 'Night Market' },
        ],
      },
      {
        day_no: 4, date: '2027-06-18', title: 'Flight ke Da Lat & Datanla Alpine Coaster',
        desc: 'Penerbangan domestik singkat dari Da Nang menuju dataran tinggi sejuk Da Lat (City of Eternal Spring 1.500 mdpl). Menjajal coaster hutan Datanla dan arsitektur nyentrik Crazy House.',
        activities: [
          { time: '08:30', type: 'transport', title: 'Transfer ke Bandara Da Nang & Flight to Da Lat', loc: 'Lien Khuong Airport' },
          { time: '12:00', type: 'general', title: 'Tiba di Da Lat yang Berhawa Dingin & Check-in Hotel', loc: 'Da Lat City' },
          { time: '14:00', type: 'highlight', title: 'Adrenalin Meluncur di Datanla Waterfalls Alpine Coaster', loc: 'Datanla Falls' },
          { time: '16:30', type: 'highlight', title: 'Menjelajahi Hang Nga Guesthouse (Crazy House)', loc: 'Crazy House' },
          { time: '19:00', type: 'meal', title: 'Makan Malam Hotpot Ayam Daun E & Pizza Vietnam di Da Lat Market', loc: 'Da Lat Night Market' },
        ],
      },
      {
        day_no: 5, date: '2027-06-19', title: 'Cloud Hunting di Cau Dat Tea Hill & Hydrangea Garden',
        desc: 'Bangun pagi berburu lautan awan menakjubkan di atas bukit teh kuno Cau Dat, berfoto di kebun bunga hydrangea biru raksasa, dan ngopi sore di kafe pinus lereng bukit.',
        activities: [
          { time: '05:30', type: 'highlight', title: 'Sunrise Cloud Hunting Experience di Cau Dat Tea Hill', loc: 'Cau Dat' },
          { time: '09:00', type: 'meal', title: 'Sarapan Hangat Banh Mi Xiu Mai Khas Da Lat', loc: 'Local Warung' },
          { time: '10:30', type: 'highlight', title: 'Exploring Kebun Bunga Hydrangea Terluas di Da Lat', loc: 'Hydrangea Farm' },
          { time: '14:00', type: 'highlight', title: 'Ngopi Chill di Kafe Kaca Hutan Pinus (Lululola Coffee)', loc: 'Pine Hill Cafe' },
          { time: '18:30', type: 'meal', title: 'Makan Malam Penutupan Bersama Circle di Pinggir Danau Xuan Huong', loc: 'Xuan Huong Lake' },
        ],
      },
      {
        day_no: 6, date: '2027-06-20', title: 'Da Lat Souvenirs, Transfer Airport & Flight Back',
        desc: 'Membeli selai buah murbei, kopi arabika Da Lat, dan teh artichoke, checkout hotel, dan perjalanan kembali ke Jakarta membawa kenangan manis.',
        activities: [
          { time: '09:00', type: 'general', title: 'Belanja Oleh-oleh Khas Da Lat & Packing', loc: 'Da Lat Market' },
          { time: '11:00', type: 'transport', title: 'Transfer ke Lien Khuong International Airport (DLI)', loc: 'Lien Khuong Airport' },
          { time: '13:30', type: 'flight', title: 'Penerbangan Kembali Menuju Jakarta (CGK)', loc: 'En Route Jakarta' },
          { time: '19:00', type: 'general', title: 'Touchdown Jakarta dengan Sahabat Baru!', loc: 'Soekarno-Hatta T3' },
        ],
      },
    ];

    await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [vietSouthVersionId]);
    for (const d of vietSouthDays) {
      const dayRes = await client.query(
        `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [vietSouthVersionId, d.day_no, d.date, d.title, d.desc]
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

    // Vietnam South Price Options
    const vietSouthFullInc = [
      'Tiket Pesawat Internasional PP Jakarta - Da Nang / Da Lat - Jakarta',
      'Tiket Penerbangan Domestik Da Nang ke Da Lat',
      'Transportasi Privat Ber-AC selama di Da Nang, Hoi An, dan Da Lat',
      'Hotel Bintang 3 di Da Nang (Tepi Pantai) & Da Lat (Twin Sharing)',
      'Tiket Cable Car & Tiket Masuk Sun World Ba Na Hills + Golden Bridge',
      'Tiket Perahu Kelapa Cam Thanh Basket Boat & Lampion Sungai Hoai',
      'Tiket Datanla Alpine Coaster & Tiket Masuk Crazy House',
      'Makan sesuai jadwal itinerary (Kuliner Otentik Vietnam)',
      'Tour Leader VWS yang mendampingi sepanjang perjalanan',
      'Dokumentasi Foto & Video Perjalanan Keren',
    ];

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, is_enabled
      ) VALUES (
        $1, 'VTN-DAN-FULL', 'Full Package (Termasuk Pesawat PP & Domestik)', 'full', 'sharing',
        14800000, 12800000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr`,
      [vietSouthVersionId, JSON.stringify(vietSouthFullInc), JSON.stringify(vietExclusions)]
    );

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, land_meeting_info, is_enabled
      ) VALUES (
        $1, 'VTN-DAN-LAND', 'Land Tour Only (Bertemu di Da Nang)', 'land_only', 'sharing',
        9800000, 8200000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        1500000, $2, $3, 'Da Nang International Airport (DAD) pada 15 Juni 2027 pukul 14:00', true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        land_meeting_info = EXCLUDED.land_meeting_info`,
      [vietSouthVersionId, JSON.stringify(vietSouthFullInc.slice(2)), JSON.stringify(vietExclusions)]
    );

    // =========================================================================
    // 5. CENTRAL ASIA: Kazakhstan & Kyrgyzstan Expedition (8 Days 7 Nights)
    // =========================================================================
    const centralAsiaSeries = await client.query(
      `INSERT INTO trip_series (destination_id, name, slug, season, description, publish_state)
       VALUES ($1, 'Central Asia: Kazakhstan & Kyrgyzstan Expedition', 'kazakhstan-kyrgyzstan', 'Summer 2027', 'Petualangan epik melintasi 2 negara Asia Tengah: Ngarai Charyn, danau pohon tenggelam Kaindy, menyeberangi perbatasan darat menuju Danau Issyk-Kul Kyrgyzstan, tebing Fairytale Canyon, dan pegunungan gletser Ala Archa.', 'published')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
       RETURNING id`,
      [kazakhstanDestId]
    );
    const centralAsiaSeriesId = centralAsiaSeries.rows[0].id;

    const centralAsiaBatch = await client.query(
      `INSERT INTO batches (
        trip_series_id, batch_code, slug, departure_date, return_date, departure_timezone,
        capacity, booking_state, show_exact_seats, limited_seats_threshold
      ) VALUES ($1, 'CENTRALASIA-01', 'batch-01-jul-2027', '2027-07-10', '2027-07-17', 'Asia/Jakarta', 12, 'open', true, 4)
      ON CONFLICT (slug) DO UPDATE SET booking_state = 'open', capacity = 12
      RETURNING id`,
      [centralAsiaSeriesId]
    );
    const centralAsiaBatchId = centralAsiaBatch.rows[0].id;

    const centralAsiaVer = await client.query(
      `INSERT INTO batch_content_versions (
        batch_id, revision_no, status, title, lead, route_summary, departure_meeting_info, published_at, created_by_admin
      ) VALUES (
        $1, 1, 'published',
        'Central Asia: Kazakhstan & Kyrgyzstan Silk Road & Wilderness',
        'Ekspedisi 2 negara Asia Tengah yang legendaris: Kazakhstan dan Kyrgyzstan! Menyusuri Grand Canyon Charyn, danau pohon tenggelam Kaindy, menginap di Yurt camp tepi danau abadi Issyk-Kul, dan trekking gletser Ala Archa.',
        'Almaty ➔ Charyn Canyon ➔ Kaindy Sunken Forest ➔ Kolsai Lake ➔ Issyk-Kul (Kyrgyzstan) ➔ Skazka Canyon ➔ Ala Archa ➔ Bishkek',
        'Bandara Internasional Soekarno-Hatta Terminal 3 (WIB)',
        CURRENT_TIMESTAMP, $2
      )
      ON CONFLICT (batch_id, revision_no) DO UPDATE SET status = 'published'
      RETURNING id`,
      [centralAsiaBatchId, adminId]
    );
    const centralAsiaVersionId = centralAsiaVer.rows[0].id;
    await client.query(`UPDATE batches SET published_version_id = $1 WHERE id = $2`, [centralAsiaVersionId, centralAsiaBatchId]);

    // Central Asia Itinerary (8 Days)
    const centralAsiaDays = [
      {
        day_no: 1, date: '2027-07-10', title: 'Landing di Almaty (Kazakhstan) & Kok Tobe Sunset',
        desc: 'Penerbangan dari Jakarta tiba di kota terindah Kazakhstan, Almaty. Naik cable car menuju bukit Kok Tobe menyaksikan panorama kota berlatar puncak salju Zailiysky Alatau, makan malam Shaslik lokal.',
        activities: [
          { time: '11:00', type: 'flight', title: 'Landing di Almaty International Airport (ALA)', loc: 'Almaty' },
          { time: '14:00', type: 'general', title: 'Check-in Hotel Berbintang di Pusat Kota Almaty', loc: 'Almaty City' },
          { time: '16:30', type: 'highlight', title: 'Cable Car Ride ke Kok Tobe & Monumen The Beatles', loc: 'Kok Tobe Hill' },
          { time: '19:00', type: 'meal', title: 'Makan Malam Pembuka Khas Asia Tengah: Daging Shaslik & Lagman', loc: 'Almaty' },
        ],
      },
      {
        day_no: 2, date: '2027-07-11', title: 'Charyn Canyon (Grand Canyon of Central Asia)',
        desc: 'Perjalanan menuju keajaiban geologis Charyn Canyon yang terbentuk jutaan tahun lalu. Berjalan kaki di dasar Valley of Castles dengan tebing-tebing merah megah yang menjulang.',
        activities: [
          { time: '08:00', type: 'transport', title: 'Menuju Kawasan Konservasi Charyn Canyon (3.5 Jam)', loc: 'Charyn National Park' },
          { time: '11:30', type: 'highlight', title: 'Trekking di Lembah Valley of Castles & Sungai Charyn', loc: 'Valley of Castles' },
          { time: '14:00', type: 'meal', title: 'Makan Siang Piknik di Tepi Aliran Sungai Charyn', loc: 'Charyn River' },
          { time: '16:30', type: 'transport', title: 'Menuju Desa Pegunungan Saty Basecamp Danau Kolsai', loc: 'Saty Village' },
          { time: '19:00', type: 'general', title: 'Menginap di Homestay Tradisional Kazakh & Makan Malam Hangat', loc: 'Saty' },
        ],
      },
      {
        day_no: 3, date: '2027-07-12', title: 'Sunken Forest of Lake Kaindy & Lower Kolsai Lake',
        desc: 'Mengendarai mobil 4x4 offroad Soviet UAZ menuju Danau Kaindy yang mistis dengan batang pohon cemara Schrenk tegak berdiri di air es pirus, dilanjutkan trekking di tepi Danau Kolsai.',
        activities: [
          { time: '08:30', type: 'transport', title: 'Off-road 4x4 Ride Menembus Hutan Pegunungan ke Lake Kaindy', loc: 'Kaindy Trail' },
          { time: '10:00', type: 'highlight', title: 'Menyaksikan Keajaiban Pohon Tenggelam Lake Kaindy', loc: 'Lake Kaindy' },
          { time: '13:00', type: 'meal', title: 'Makan Siang Sup Daging Domba Beshbarmak Tradisional', loc: 'Saty' },
          { time: '14:30', type: 'highlight', title: 'Strolling & Foto Danau Zamrud Lower Kolsai Lake', loc: 'Kolsai Lake' },
          { time: '18:00', type: 'general', title: 'Kembali ke Saty & Menikmati Suasana Malam Berbintang', loc: 'Saty Village' },
        ],
      },
      {
        day_no: 4, date: '2027-07-13', title: 'Border Crossing ke Kyrgyzstan & Danau Issyk-Kul',
        desc: 'Hari bersejarah menyeberangi perbatasan darat dari Kazakhstan memasuki Republik Kyrgyzstan! Tiba di danau alpine raksasa Danau Issyk-Kul dan bermalam di tenda Yurt tradisional tepi pantai.',
        activities: [
          { time: '08:00', type: 'transport', title: 'Perjalanan Menuju Pos Perbatasan Kegen (Kazakhstan - Kyrgyzstan)', loc: 'Kegen Border' },
          { time: '11:00', type: 'general', title: 'Proses Cap Paspor & Memasuki Wilayah Kyrgyzstan', loc: 'Kyrgyz Border' },
          { time: '13:30', type: 'meal', title: 'Makan Siang Ashlan-fu Otentik di Kota Karakol', loc: 'Karakol' },
          { time: '15:30', type: 'highlight', title: 'Tiba di Danau Mutiara Issyk-Kul (Danau Alpine Terbesar)', loc: 'Issyk-Kul Lake' },
          { time: '18:00', type: 'general', title: 'Check-in Authentic Yurt Camp di Tepi Danau Issyk-Kul & Api Unggun', loc: 'Yurt Camp' },
        ],
      },
      {
        day_no: 5, date: '2027-07-14', title: 'Skazka (Fairytale) Canyon & Karakol Dungan Mosque',
        desc: 'Menjelajahi formasi tebing tanah liat berwarna merah, jingga, dan kuning seperti negeri dongeng di Skazka Canyon, serta melihat keunikan masjid kayu Dungan yang dibangun tanpa satu paku pun.',
        activities: [
          { time: '08:30', type: 'highlight', title: 'Exploring Labirin Ajaib Skazka (Fairytale) Canyon', loc: 'Skazka Canyon' },
          { time: '12:00', type: 'meal', title: 'Makan Siang Ikan Danau Panggang di Tepi Issyk-Kul', loc: 'Issyk-Kul' },
          { time: '14:30', type: 'highlight', title: 'Kunjungan Arsitektur Masjid Kayu Dungan & Gereja Ortodoks', loc: 'Karakol' },
          { time: '17:00', type: 'highlight', title: 'Atraksi Menunggang Kuda & Eagle Hunting Demonstration', loc: 'Bokonbayevo' },
          { time: '20:00', type: 'general', title: 'Makan Malam Hangat di Yurt Camp di Bawah Langit Galaksi', loc: 'Yurt Camp' },
        ],
      },
      {
        day_no: 6, date: '2027-07-15', title: 'Jeti-Oguz (Seven Bulls) & Perjalanan ke Bishkek',
        desc: 'Menikmati panorama tebing merah legendaris Seven Bulls Rocks dan Lembah Bunga (Kok-Jaiyk), dilanjutkan perjalanan darat spektakuler menuju ibukota Kyrgyzstan, Bishkek.',
        activities: [
          { time: '08:30', type: 'highlight', title: 'Foto di Tebing Merah Jeti-Oguz (Seven Bulls Rocks)', loc: 'Jeti-Oguz' },
          { time: '11:00', type: 'transport', title: 'Scenic Highway Drive Menyusuri Danau Menuju Bishkek', loc: 'Highway Bishkek' },
          { time: '13:30', type: 'meal', title: 'Makan Siang Samsa Daging Renyah & Manty', loc: 'Boom Gorge' },
          { time: '17:00', type: 'general', title: 'Tiba di Bishkek & Check-in Hotel Berbintang', loc: 'Bishkek' },
          { time: '19:00', type: 'highlight', title: 'Ala-Too Square & Monumen Pahlawan Manas di Malam Hari', loc: 'Ala-Too Square' },
        ],
      },
      {
        day_no: 7, date: '2027-07-16', title: 'Ala Archa National Park Alpine Glacier Trekking',
        desc: 'Trekking di lembah pegunungan glasial Ala Archa yang spektakuler dengan tebing-tebing granit tinggi dan sungai es jernih. Malam perpisahan mengenang ekspedisi 2 negara bersama circle baru.',
        activities: [
          { time: '09:00', type: 'transport', title: 'Perjalanan 45 Menit Menuju Ala Archa National Park', loc: 'Ala Archa' },
          { time: '10:00', type: 'highlight', title: 'Alpine Trekking ke Air Terjun Ak-Sai & Lembah Gletser', loc: 'Ak-Sai Waterfall' },
          { time: '13:30', type: 'meal', title: 'Makan Siang di Lodge Pegunungan Bernuansa Kayu', loc: 'Ala Archa Lodge' },
          { time: '16:00', type: 'general', title: 'Kembali ke Bishkek & Belanja Souvenir Kain Wol di Osh Bazaar', loc: 'Osh Bazaar' },
          { time: '19:30', type: 'meal', title: 'Farewell Gala Dinner Central Asia dengan Circle Baru', loc: 'Bishkek Fine Dining' },
        ],
      },
      {
        day_no: 8, date: '2027-07-17', title: 'Bishkek Manas Airport & Penerbangan ke Jakarta',
        desc: 'Sarapan pagi santai, checkout hotel, dan transfer ke Manas International Airport Bishkek untuk penerbangan pulang ke Jakarta dengan membawa sahabat dan pengalaman langka.',
        activities: [
          { time: '08:30', type: 'general', title: 'Sarapan Terakhir & Persiapan Paspor', loc: 'Hotel Bishkek' },
          { time: '10:30', type: 'transport', title: 'Transfer ke Manas International Airport (FRU)', loc: 'Manas Airport' },
          { time: '13:30', type: 'flight', title: 'Penerbangan Bishkek menuju Jakarta (Transit)', loc: 'En Route Jakarta' },
          { time: '22:30', type: 'general', title: 'Touchdown Jakarta dengan Gelar Penjelajah Asia Tengah!', loc: 'Soekarno-Hatta T3' },
        ],
      },
    ];

    await client.query(`DELETE FROM itinerary_days WHERE version_id = $1`, [centralAsiaVersionId]);
    for (const d of centralAsiaDays) {
      const dayRes = await client.query(
        `INSERT INTO itinerary_days (version_id, day_no, local_date, title, description)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [centralAsiaVersionId, d.day_no, d.date, d.title, d.desc]
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

    // Central Asia Price Options
    const centralAsiaFullInc = [
      'Tiket Pesawat Internasional PP Jakarta - Almaty (Kazakhstan) / Bishkek (Kyrgyzstan) - Jakarta',
      'Transportasi Privat Khusus 4x4 Soviet UAZ & Minibus Ber-AC Lintas Negara',
      'Akomodasi Hotel Bintang 3/4 di Almaty & Bishkek (Twin Sharing)',
      'Pengalaman Menginap 2 Malam di Authentic Yurt Camp di Tepi Danau Issyk-Kul',
      'Izin Masuk & Konservasi Taman Nasional Charyn Canyon, Kaindy & Kolsai Lakes',
      'Izin Masuk & Konservasi Skazka Canyon & Ala Archa National Park',
      'Demonstrasi Berburu Elang Tradisional Nomad (Eagle Hunting)',
      'Makan 3x sehari kuliner otentik khas Kazakhstan & Kyrgyzstan',
      'Tour Leader VWS & Pemandu Lokal Berlisensi Bahasa Inggris/Indonesia',
      'Dokumentasi Foto & Video Perjalanan Kualitas Tinggi',
    ];
    const centralAsiaExclusions = [
      'Biaya Paspor (Kazakhstan Bebas Visa 30 Hari, Kyrgyzstan Bebas Visa 60 Hari untuk WNI)',
      'Asuransi Perjalanan Internasional (Wajib)',
      'Pengeluaran Pribadi & Jajan di luar itinerary',
      'Tipping untuk Supir & Pemandu Lokal',
    ];

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, is_enabled
      ) VALUES (
        $1, 'CAS-EXP-FULL', 'Full Package (Termasuk Pesawat PP 2 Negara)', 'full', 'sharing',
        29500000, 26500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        2000000, $2, $3, true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        included_json = EXCLUDED.included_json,
        excluded_json = EXCLUDED.excluded_json`,
      [centralAsiaVersionId, JSON.stringify(centralAsiaFullInc), JSON.stringify(centralAsiaExclusions)]
    );

    await client.query(
      `INSERT INTO price_options (
        version_id, sku, display_name, package_type, room_type, list_price_idr,
        promo_price_idr, promo_start_at, promo_end_at, dp_per_traveler_idr,
        included_json, excluded_json, land_meeting_info, is_enabled
      ) VALUES (
        $1, 'CAS-EXP-LAND', 'Land Tour Only (Bertemu di Almaty)', 'land_only', 'sharing',
        22000000, 19500000, CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '90 days',
        2000000, $2, $3, 'Almaty International Airport (ALA) Kazakhstan pada 10 Juli 2027 pukul 11:00', true
      )
      ON CONFLICT (version_id, sku) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        list_price_idr = EXCLUDED.list_price_idr,
        promo_price_idr = EXCLUDED.promo_price_idr,
        land_meeting_info = EXCLUDED.land_meeting_info`,
      [centralAsiaVersionId, JSON.stringify(centralAsiaFullInc.slice(1)), JSON.stringify(centralAsiaExclusions)]
    );

    await client.query('COMMIT');
    console.log('[SEED] SUCCESS: All Destinations, Itineraries, and Price Options seeded perfectly!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[SEED] ERROR:', err);
    throw err;
  } finally {
    client.release();
  }
}

seedAllDestinations()
  .then(() => {
    console.log('[SEED] Finished successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[SEED] Failed:', err);
    process.exit(1);
  });
