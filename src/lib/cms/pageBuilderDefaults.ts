import { query } from '../db';

export interface PageSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  imageUrl?: string;
  linkUrl?: string;
  icon?: string;
  tag?: string;
  date?: string;
  price?: string;
  author?: string;
  countryCode?: string;
  [key: string]: any;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'destinations' | 'premise' | 'trips_catalog' | 'stories' | 'bottom_cta' | 'faq' | 'text_image' | 'banner';
  name: string;
  isVisible: boolean;
  badge?: string;
  title: string;
  subtitle?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  imageUrl?: string;
  bgTheme?: 'white' | 'sand' | 'dark';
  items?: PageSectionItem[];
  customConfig?: Record<string, any>;
}

export interface PageConfig {
  pageId: string;
  pageTitle: string;
  updatedAt?: string;
  sections: PageSection[];
}

export const DEFAULT_HOME_PAGE_CONFIG: PageConfig = {
  pageId: 'home',
  pageTitle: 'Halaman Utama (Homepage)',
  sections: [
    {
      id: 'section_hero',
      type: 'hero',
      name: 'Hero Banner & Featured Journey',
      isVisible: true,
      badge: 'Curated Open-Trip Travel Club',
      title: 'Travel with Strangers. Come Home with Friends.',
      description: 'Bukan rombongan tur 40 orang yang kaku. Kami mengkurasi perjalanan circle kecil (maksimal 10–12 pax) untuk solo traveler, Gen Z, dan first-jobber menikmati rute autentik dunia secara hangat, santai, dan tanpa rasa canggung.',
      primaryCtaText: 'Jelajahi Jadwal Perjalanan',
      primaryCtaUrl: '#explore-trips',
      secondaryCtaText: 'Tanya Admin',
      secondaryCtaUrl: 'https://wa.me/6285774999875',
      customConfig: {
        valuePillars: [
          { text: 'Circle Kecil (Max 12 Pax)', icon: 'Users' },
          { text: '90% Berangkat Solo', icon: 'Compass' },
          { text: 'Cicilan Flat s/d H-30', icon: 'CalendarBlank' },
        ],
        featuredTrip: {
          badge: 'FEATURED JOURNEY',
          title: 'Japan Countryside Autumn Trip (8D7N)',
          route: 'Osaka ➔ Gifu ➔ Suwa ➔ Nagano ➔ Tokyo',
          date: '07–14 Nov 2026',
          price: 'Rp 21.000.000',
          seats: '5 Seats Tersedia',
          url: '/trips/japan-autumn/batch-01-nov-2026',
          image: '/images/autumn-hero.jpg',
        },
      },
    },
    {
      id: 'section_destinations',
      type: 'destinations',
      name: 'Where We Wander (Destinations Bento)',
      isVisible: true,
      badge: 'Where We Wander',
      title: 'Eksplorasi Destinasi Dunia',
      description: 'Dari desa pegunungan Alpen Jepang, ngarai mistis Yunnan China, terasering kabut Sapa Vietnam, hingga padang stepa megah Asia Tengah.',
      items: [
        {
          id: 'dest_jp',
          title: 'Jepang (Japan)',
          subtitle: 'Autumn Countryside • Winter Snow • Spring Bloom',
          description: 'Dari pesona gugur pedesaan Nagano dan lembah Kamikochi, hingga salju magis Shirakawa-go.',
          imageUrl: '/images/autumn-hero.jpg',
          linkUrl: '/trips?country=JP',
          badge: 'Batch Aktif',
          countryCode: 'JP',
        },
        {
          id: 'dest_cn',
          title: 'China: Mystical Yunnan',
          subtitle: 'Kunming • Dali • Lijiang • Shangri-La',
          description: 'Bersepeda di tepi danau Erhai, menatap puncak salju Jade Dragon Snow Mountain, dan menyusuri ngarai terdalam Tiger Leaping Gorge.',
          imageUrl: '/images/destinations/china.jpg',
          linkUrl: '/trips/china-yunnan/batch-01-may-2027',
          badge: 'Curated Route',
          countryCode: 'CN',
        },
        {
          id: 'dest_vn',
          title: 'Vietnam: Hanoi, Sapa & Da Nang',
          subtitle: 'North Highlands & Central Coastal Cities',
          description: 'Kabut mistis perbukitan Sapa, menaklukkan atap Indochina Fansipan 3.143m, hingga pesisir lampion Hoi An dan Da Lat.',
          imageUrl: '/images/destinations/vietnam.jpg',
          linkUrl: '/trips/vietnam-hanoi-sapa/batch-01-hanoi-apr-2027',
          badge: 'Curated Route',
          countryCode: 'VN',
        },
        {
          id: 'dest_kz',
          title: 'Central Asia: Kazakhstan & Kyrgyzstan',
          subtitle: 'Silk Road & Wilderness Expedition',
          description: 'Bentang alam liar Asia Tengah: kemegahan Ngarai Charyn, danau tenggelam Kaindy, dan bermalam di tenda Yurt tepi Danau Issyk-Kul.',
          imageUrl: '/images/destinations/kazakhstan.jpg',
          linkUrl: '/trips/kazakhstan-kyrgyzstan/batch-01-jul-2027',
          badge: 'New Expedition',
          countryCode: 'KZ',
        },
      ],
    },
    {
      id: 'section_premise',
      type: 'premise',
      name: 'The Strangers Premise & Pillars',
      isVisible: true,
      badge: 'The Strangers Premise',
      title: 'Kenapa Menjelajahi Dunia Bareng Orang Baru Lebih Berkesan?',
      description: 'Vacay With Strangers memadukan kebebasan solo travel dengan kehangatan komunitas kecil. Kamu bebas menikmati dunia tanpa beban kecanggungan atau drama teman yang wacana.',
      customConfig: {
        guaranteeTitle: 'Zero Awkwardness Guarantee',
        guaranteeText: 'Kami merancang aktivitas natural, ice-breaking santai, circular dinner, dan waktu luang seimbang sehingga di hari ke-3 kamu sudah merasa seperti teman lama.',
      },
      items: [
        {
          id: 'pillar_1',
          title: 'Circle Kecil (Max 10–12 Pax)',
          description: 'Bukan tur rombongan 40 orang yang kaku dan dikejar waktu. Skala grup yang intim bikin semua traveler akrab dan terasa seperti liburan bareng sahabat.',
          icon: 'UsersThree',
        },
        {
          id: 'pillar_2',
          title: '90% Berangkat Sendirian',
          description: 'Nggak perlu nungguin teman yang sering wacana. Mayoritas peserta daftar solo dan langsung menemukan circle baru yang sefrekuensi sejak hari pertama.',
          icon: 'Handshake',
        },
        {
          id: 'pillar_3',
          title: 'Rute Pedesaan & Hidden Spots',
          description: 'Dari desa tradisional, onsen pegunungan, keindahan alam, hingga kuliner lokal autentik yang nggak akan kamu temukan di paket tur biasa.',
          icon: 'Compass',
        },
        {
          id: 'pillar_4',
          title: 'Skema Cicilan Transparan H-30',
          description: 'DP ringan dan cicilan bulanan flat tanpa bunga sampai H-30 keberangkatan. Tanpa biaya siluman dan tanpa paksaan belanja ke toko turis.',
          icon: 'ShieldCheck',
        },
      ],
    },
    {
      id: 'section_trips_catalog',
      type: 'trips_catalog',
      name: 'Upcoming Trips Catalog',
      isVisible: true,
      badge: 'Jadwal & Rute Terkurasi',
      title: 'Upcoming Trip Batches',
      description: 'Pilih petualanganmu berikutnya. Seluruh trip dibatasi maksimal 10–12 pax untuk menjaga keintiman circle dan pengalaman autentik.',
      customConfig: {
        directoryLinkText: 'Buka Seluruh Direktori',
        directoryLinkUrl: '/trips',
      },
    },
    {
      id: 'section_stories',
      type: 'stories',
      name: 'Community Stories & Reviews',
      isVisible: true,
      badge: 'Catatan Perjalanan',
      title: 'Strangers Who Found Friends',
      description: 'Cerita nyata dari mereka yang awalnya nekat berangkat sendirian.',
      items: [
        {
          id: 'story_1',
          title: 'Berangkat solo deg-degan banget, pas hari ke-2 udah berasa liburan sama bestie.',
          author: 'Dinda, Jakarta',
          tag: 'Japan Autumn Batch 01',
          imageUrl: '/images/stories/story-group.jpg',
        },
        {
          id: 'story_2',
          title: 'Rute pedesaannya juara. Shinkansen, cycling di Azumino, makan bareng di izakaya lokal.',
          author: 'Fajar, Bandung',
          tag: 'Japan Autumn Batch 01',
          imageUrl: '/images/stories/story-mountain.jpg',
        },
        {
          id: 'story_3',
          title: 'Nggak ada paksaan belanja toko oleh-oleh. Semuanya natural, foto-foto dokumentasinya keren parah!',
          author: 'Clarissa, Surabaya',
          tag: 'Japan Autumn Batch 01',
          imageUrl: '/images/stories/story-road.jpg',
        },
      ],
    },
    {
      id: 'section_bottom_cta',
      type: 'bottom_cta',
      name: 'Bottom Invitation & WhatsApp Consultation',
      isVisible: true,
      badge: 'Siap Melangkah?',
      title: 'Dunia Terlalu Luas untuk Ditunggu Sendirian.',
      description: 'Tak perlu menunda petualangan karena teman yang wacana. Gabung di circle kecil VWS, nikmati rute otentik dunia, dan pulang dengan sahabat baru seumur hidup.',
      primaryCtaText: 'Konsultasi Slot via WhatsApp',
      primaryCtaUrl: 'https://wa.me/6285774999875',
      secondaryCtaText: 'Lihat Instagram @vacaywithstrangers',
      secondaryCtaUrl: 'https://instagram.com/vacaywithstrangers',
      customConfig: {
        reassurancePills: [
          'Maksimal 12 Pax per Batch',
          '90% Berangkat Solo',
          'Cicilan Transparan s/d H-30',
        ],
      },
    },
  ],
};

export const DEFAULT_ABOUT_PAGE_CONFIG: PageConfig = {
  pageId: 'about',
  pageTitle: 'Tentang Kami & Manifesto',
  sections: [
    {
      id: 'section_about_hero',
      type: 'hero',
      name: 'Manifesto Hero',
      isVisible: true,
      badge: 'The Strangers Story',
      title: 'Travel Fun. Travel Together.',
      description: 'Vacay With Strangers didirikan untuk siapa pun yang ingin menjelajahi dunia tanpa harus terhalang teman yang wacana. Kami mempertemukan solo traveler, Gen Z, dan first-jobber dalam circle kecil yang akrab dan saling menghargai.',
    },
    {
      id: 'section_about_pillars',
      type: 'premise',
      name: '3 Standar Kurasi VWS',
      isVisible: true,
      badge: 'Standar Kami',
      title: 'Kenapa Kami Membatasi Peserta?',
      description: 'Kami menolak konsep mass tourism bus 40 orang.',
      items: [
        {
          id: 'std_1',
          title: 'Circle Kecil (Max 10–12 Pax)',
          description: 'Semua orang saling mengenal namanya, tidak ada yang terisolasi atau tertinggal di belakang.',
        },
        {
          id: 'std_2',
          title: 'Zero Awkwardness Atmosphere',
          description: 'Aktivitas yang didesain mencairkan suasana secara natural tanpa games norak atau paksaan.',
        },
        {
          id: 'std_3',
          title: '100% Bebas Turis Trap',
          description: 'Tanpa kewajiban mampir ke toko giok, teh, atau perhiasan yang membuang waktu liburanmu.',
        },
      ],
    },
  ],
};

export const DEFAULT_TERMS_PAGE_CONFIG: PageConfig = {
  pageId: 'terms',
  pageTitle: 'Syarat & Ketentuan Perjalanan',
  sections: [
    {
      id: 'section_terms_hero',
      type: 'hero',
      name: 'Ketentuan Header',
      isVisible: true,
      badge: 'Ketentuan & Transparansi',
      title: 'Syarat & Ketentuan Perjalanan',
      description: 'Seluruh ketentuan operasional dibuat transparan di awal untuk melindungi hak dan kenyamanan seluruh circle perjalanan.',
    },
    {
      id: 'section_terms_faq',
      type: 'faq',
      name: 'Kebijakan Operasional',
      isVisible: true,
      title: 'Aturan Booking, Cicilan & Pembatalan',
      items: [
        {
          id: 'term_1',
          title: 'Booking Seat & Down Payment (DP)',
          description: 'DP sebesar Rp 1.500.000 bersifat mengikat untuk mengamankan 1 dari 12 seat resmi. DP non-refundable jika pembatalan sepihak dilakukan peserta.',
        },
        {
          id: 'term_2',
          title: 'Skema Cicilan & Batas Pelunasan H-30',
          description: 'Sisa pembayaran dicicil flat setiap bulan. Seluruh biaya perjalanan wajib dilunasi paling lambat 30 hari sebelum tanggal keberangkatan (H-30).',
        },
        {
          id: 'term_3',
          title: 'Kebijakan Pindah Jadwal (Reschedule)',
          description: 'Pengajuan pindah batch dapat dilakukan maksimal H-45 sebelum tanggal keberangkatan dengan syarat batch tujuan masih memiliki seat kosong.',
        },
        {
          id: 'term_4',
          title: 'Persyaratan Paspor & Visa',
          description: 'Masa berlaku paspor minimal 6 bulan dari tanggal kepulangan. Tim VWS menyediakan berkas resmi pendukung visa (itinerary dan bukti reservasi akomodasi).',
        },
      ],
    },
  ],
};

export const SECTION_TEMPLATES: Array<{
  type: PageSection['type'];
  name: string;
  description: string;
  defaultSection: PageSection;
}> = [
  {
    type: 'hero',
    name: 'Hero Banner',
    description: 'Headline besar pembuka halaman dengan tombol Call-to-Action dan kartu sorotan.',
    defaultSection: {
      id: '',
      type: 'hero',
      name: 'Hero Section Baru',
      isVisible: true,
      badge: 'HIGHLIGHT SECTION',
      title: 'Judul Utama Menawan',
      description: 'Deskripsi pengantar yang menarik dan to the point untuk menyapa pengunjung.',
      primaryCtaText: 'Tombol Utama',
      primaryCtaUrl: '#',
      secondaryCtaText: 'Tombol Sekunder',
      secondaryCtaUrl: '#',
    },
  },
  {
    type: 'destinations',
    name: 'Bento Showcase Grid',
    description: 'Grid visual asimetris untuk menampilkan kartu destinasi atau foto unggulan.',
    defaultSection: {
      id: '',
      type: 'destinations',
      name: 'Bento Showcase Grid',
      isVisible: true,
      badge: 'DESTINASI UNGGULAN',
      title: 'Eksplorasi Rute Terpilih',
      description: 'Pilihan kawasan eksotis yang dirancang khusus untuk petualangan bersama circle.',
      items: [
        {
          id: 'item_1',
          title: 'Nama Destinasi 1',
          subtitle: 'Sub-kawasan atau musim',
          description: 'Deskripsi singkat mengenai keindahan dan aktivitas unik di lokasi ini.',
          imageUrl: '/images/autumn-hero.jpg',
          linkUrl: '/trips',
          badge: 'Open Batch',
        },
        {
          id: 'item_2',
          title: 'Nama Destinasi 2',
          subtitle: 'Sub-kawasan atau musim',
          description: 'Deskripsi singkat mengenai keindahan dan aktivitas unik di lokasi ini.',
          imageUrl: '/images/destinations/china.jpg',
          linkUrl: '/trips',
          badge: 'Curated Route',
        },
      ],
    },
  },
  {
    type: 'premise',
    name: 'Feature Pillars (3–4 Kolom)',
    description: 'Pilar nilai atau keunggulan yang membedakan VWS dengan tur massal biasa.',
    defaultSection: {
      id: '',
      type: 'premise',
      name: 'Pilar Keunggulan',
      isVisible: true,
      badge: 'KENAPA MEMILIH KAMI',
      title: 'Standar Perjalanan Kami',
      description: 'Prinsip utama yang selalu kami jaga dalam setiap batch perjalanan.',
      items: [
        {
          id: 'p_1',
          title: 'Circle Kecil & Eksklusif',
          description: 'Kapasitas maksimal dibatasi agar setiap peserta saling mengenal akrab.',
          icon: 'UsersThree',
        },
        {
          id: 'p_2',
          title: 'Itinerary Fleksibel & Seimbang',
          description: 'Waktu eksplorasi yang cukup tanpa rasa terburu-buru.',
          icon: 'Compass',
        },
        {
          id: 'p_3',
          title: 'Cicilan Transparan',
          description: 'Biaya jelas sejak awal tanpa ada biaya siluman di lapangan.',
          icon: 'ShieldCheck',
        },
      ],
    },
  },
  {
    type: 'faq',
    name: 'FAQ / Tanya Jawab',
    description: 'Daftar pertanyaan yang sering diajukan dengan jawaban yang jelas.',
    defaultSection: {
      id: '',
      type: 'faq',
      name: 'FAQ & Pertanyaan Umum',
      isVisible: true,
      badge: 'FREQUENTLY ASKED QUESTIONS',
      title: 'Pertanyaan yang Sering Diajukan',
      description: 'Semua jawaban penting seputar cara bergabung, persiapan, dan teknis perjalanan.',
      items: [
        {
          id: 'faq_1',
          title: 'Apakah aman ikut trip sendirian (solo)?',
          description: 'Sangat aman! Lebih dari 90% peserta VWS mendaftar solo. Sejak meeting point pertama, tour leader kami akan memfasilitasi circle agar langsung akrab.',
        },
        {
          id: 'faq_2',
          title: 'Bagaimana sistem pembayaran cicilan?',
          description: 'Cukup booking seat dengan DP Rp 1.500.000. Sisa pembayaran dibagi rata per bulan sampai dengan H-30 sebelum keberangkatan.',
        },
      ],
    },
  },
  {
    type: 'stories',
    name: 'Testimoni & Cerita Circle',
    description: 'Ulasan dan kutipan nyata dari traveler yang telah selesai mengikuti trip.',
    defaultSection: {
      id: '',
      type: 'stories',
      name: 'Cerita Peserta',
      isVisible: true,
      badge: 'ULASAN TRAVELER',
      title: 'Kisah Sahabat Baru',
      description: 'Kesan dan pengalaman dari mereka yang telah menjelajah bersama kami.',
      items: [
        {
          id: 'rev_1',
          title: 'Pengalaman liburan terbaik yang pernah aku ikuti!',
          author: 'Alif, Jakarta',
          tag: 'Japan Autumn',
          imageUrl: '/images/stories/story-group.jpg',
        },
      ],
    },
  },
  {
    type: 'bottom_cta',
    name: 'Call to Action Banner',
    description: 'Kotak ajakan bertindak dengan latar belakang gelap kontras dan tombol WhatsApp.',
    defaultSection: {
      id: '',
      type: 'bottom_cta',
      name: 'Call to Action Banner',
      isVisible: true,
      badge: 'GABUNG BERSAMA KAMI',
      title: 'Siap Memulai Petualangan Barumu?',
      description: 'Hubungi tim kami untuk konsultasi jadwal dan reservasi seat sebelum kuota penuh.',
      primaryCtaText: 'Hubungi Admin via WhatsApp',
      primaryCtaUrl: 'https://wa.me/6285774999875',
    },
  },
  {
    type: 'text_image',
    name: 'Text & Visual Split',
    description: 'Layout editorial 2-kolom dengan narasi di satu sisi dan foto di sisi lain.',
    defaultSection: {
      id: '',
      type: 'text_image',
      name: 'Text & Visual Split',
      isVisible: true,
      badge: 'EKSPLORASI OTIK',
      title: 'Perjalanan Autentik Menyusuri Dunia',
      description: 'Bukan sekadar berfoto di tempat wisata biasa, kami mengajakmu merasakan atmosfer lokal sesungguhnya bersama teman-teman baru.',
      imageUrl: '/images/autumn-itinerary.jpg',
      primaryCtaText: 'Lihat Dokumentasi',
      primaryCtaUrl: '/adventures',
    },
  },
];

/**
 * Loads page config from site_settings or falls back to default.
 */
export async function getPageConfig(pageId: string = 'home'): Promise<PageConfig> {
  try {
    const key = `cms_page_${pageId}`;
    const res = await query(`SELECT value_json FROM site_settings WHERE key = $1`, [key]);
    if (res.rowCount && res.rowCount > 0 && res.rows[0].value_json) {
      const parsed = res.rows[0].value_json;
      if (parsed.sections && Array.isArray(parsed.sections)) {
        return parsed as PageConfig;
      }
    }
  } catch (err) {
    console.error(`[CMS] Error loading page config for ${pageId}:`, err);
  }

  // Fallback defaults
  if (pageId === 'about') return DEFAULT_ABOUT_PAGE_CONFIG;
  if (pageId === 'terms') return DEFAULT_TERMS_PAGE_CONFIG;
  return DEFAULT_HOME_PAGE_CONFIG;
}
