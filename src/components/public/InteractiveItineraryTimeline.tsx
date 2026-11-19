'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  MapPin, 
  Clock, 
  ForkKnife, 
  AirplaneTilt, 
  Bed, 
  CheckCircle, 
  XCircle,
  Compass
} from '@phosphor-icons/react';

export interface ActivityItem {
  id?: string;
  time?: string;
  start_local_time?: string;
  end_local_time?: string;
  title: string;
  details?: string | null;
  desc?: string;
  location_name?: string;
}

export interface ItineraryDayItem {
  id?: string;
  day?: number;
  day_no?: number;
  date?: string;
  local_date?: string;
  title: string;
  city?: string;
  summary?: string;
  description?: string;
  image?: string;
  stay?: string;
  meals?: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  } | string;
  activities?: ActivityItem[];
}

export interface InteractiveItineraryTimelineProps {
  days?: ItineraryDayItem[];
  batchTitle?: string;
  destinationName?: string;
  heroImage?: string;
  included?: string[];
  excluded?: string[];
}

const defaultJapanDays = [
  {
    day: 1,
    date: '7 November 2026',
    title: 'Touchdown Osaka & Shinkansen to Nagoya',
    city: 'Osaka ➔ Nagoya',
    summary: 'Penerbangan dari Jakarta menuju Osaka. Menikmati makan malam khas Kansai, lalu merasakan sensasi kereta cepat Shinkansen menuju Nagoya.',
    image: '/images/autumn-hero.jpg',
    stay: 'Hotel 3★ Nagoya Area',
    meals: { breakfast: 'Pesawat', lunch: 'Self-choice', dinner: 'Osaka Local Food' },
    activities: [
      { time: '14:00', title: 'Landing di Kansai International Airport (KIX)', desc: 'Proses imigrasi, pengambilan bagasi, dan meeting point bersama circle.' },
      { time: '17:30', title: 'Dinner Around Osaka', desc: 'Makan malam kuliner lokal pertama bersama seluruh circle perjalanan.' },
      { time: '20:00', title: 'Shinkansen Experience Osaka - Nagoya', desc: 'Menaiki kereta cepat Shinkansen meluncur menuju kota Nagoya.' },
      { time: '21:30', title: 'Check-in Hotel Nagoya & Rest', desc: 'Istirahat dan persiapan perjalanan ke pegunungan esok hari.' },
    ],
  },
  {
    day: 2,
    date: '8 November 2026',
    title: 'Nagoya to Gifu Exploration & Transfer to Nagano',
    city: 'Nagoya ➔ Gifu ➔ Nagano',
    summary: 'Perjalanan privat sehari penuh menjelajahi keindahan wilayah Gifu, dilanjutkan perjalanan menuju dataran tinggi Nagano.',
    image: '/images/autumn-itinerary.jpg',
    stay: 'Hotel 3★ Nagano Area',
    meals: { breakfast: 'Hotel', lunch: 'Gifu Specialty', dinner: 'Nagano Soba' },
    activities: [
      { time: '08:30', title: 'Nagoya to Gifu Private Trip', desc: 'Menjelajahi kawasan pedesaan bersejarah dan panorama alam Gifu.' },
      { time: '15:00', title: 'Nagoya to Nagano Transfer', desc: 'Perjalanan panorama pegunungan menuju Nagano.' },
      { time: '18:30', title: 'Check-in Hotel di Nagano & Dinner', desc: 'Menikmati kuliner soba khas Nagano dan suasana malam yang tenang.' },
    ],
  },
  {
    day: 3,
    date: '9 November 2026',
    title: 'Togakushi Ancient Cedar Forest & Matsumoto 3N Stay',
    city: 'Nagano ➔ Togakushi ➔ Matsumoto',
    summary: 'Berjalan di jalur sakral pohon cedar raksasa Togakushi yang berusia ratusan tahun, lalu check-in basecamp di Matsumoto untuk 3 malam.',
    image: '/images/autumn-hero.jpg',
    stay: 'Hotel 3★ Matsumoto (3 Malam)',
    meals: { breakfast: 'Hotel', lunch: 'Togakushi Soba', dinner: 'Matsumoto Bistro' },
    activities: [
      { time: '09:00', title: 'Nagano to Togakushi One Day Trip', desc: 'Jalan santai di antara jejeran pohon cedar raksasa yang magis.' },
      { time: '14:30', title: 'Transfer Nagano to Matsumoto', desc: 'Menuju kota kastil Matsumoto yang sejuk di kaki pegunungan Alpen Jepang.' },
      { time: '17:00', title: 'Check-in Hotel Matsumoto (3N Stay)', desc: 'Unpack dan santai di sekitar kawasan pusat kota Matsumoto.' },
    ],
  },
  {
    day: 4,
    date: '10 November 2026',
    title: 'Azumino Cycling Experience & Daiwa Wasabi Farm',
    city: 'Matsumoto ➔ Azumino',
    summary: 'Mengayuh sepeda santai melintasi pedesaan Azumino dengan latar pegunungan Alpen, lalu mengunjungi perkebunan wasabi dengan kincir air sungai jernih.',
    image: '/images/autumn-itinerary.jpg',
    stay: 'Hotel 3★ Matsumoto',
    meals: { breakfast: 'Hotel', lunch: 'Wasabi Farm Culinary', dinner: 'Matsumoto Dining' },
    activities: [
      { time: '09:00', title: 'Matsumoto to Azumino', desc: 'Perjalanan singkat menuju lembah pedesaan Azumino yang asri.' },
      { time: '10:00', title: 'One Day Cycling Experience in Azumino', desc: 'Bersepeda santai menghirup udara segar musim gugur Jepang.' },
      { time: '13:30', title: 'Daiwa Wasabi Farm Exploration', desc: 'Melihat kincir air ikonik, mencicipi wasabi ice cream unik, dan riak air sungai jernih.' },
      { time: '17:00', title: 'Back to Matsumoto & Rest', desc: 'Kembali ke hotel dan makan malam santai.' },
    ],
  },
  {
    day: 5,
    date: '11 November 2026',
    title: 'Historic Matsumoto Castle & Sunset at Suwa Lake',
    city: 'Matsumoto ➔ Suwa Lake',
    summary: 'Menjelajahi Kastil Matsumoto (Black Crow Castle) yang otentik dari era samurai, dilanjutkan menikmati matahari terbenam spektakuler di Danau Suwa.',
    image: '/images/autumn-hero.jpg',
    stay: 'Hotel 3★ Matsumoto',
    meals: { breakfast: 'Hotel', lunch: 'Matsumoto Gourmet', dinner: 'Lake Suwa Dining' },
    activities: [
      { time: '09:30', title: 'Exploring Matsumoto Castle', desc: 'Masuk ke dalam salah satu kastil kayu tertua dan paling terawat di Jepang.' },
      { time: '14:00', title: 'Matsumoto to Suwa Lake', desc: 'Menuju danau kaldera Suwa yang legendaris.' },
      { time: '16:30', title: 'Sunset at Suwa Lake', desc: 'Menikmati golden hour musim gugur yang menawan di tepian danau.' },
      { time: '19:00', title: 'Back to Matsumoto Hotel', desc: 'Istirahat malam terakhir di Matsumoto.' },
    ],
  },
  {
    day: 6,
    date: '12 November 2026',
    title: 'Kamikochi Alpine Valley Trekking & Shinkansen to Tokyo',
    city: 'Matsumoto ➔ Kamikochi ➔ Tokyo',
    summary: 'Trekking santai di lembah sakral Kamikochi berair jernih kristal diapit puncak salju Alpen Jepang, dilanjutkan perjalanan Shinkansen menuju Tokyo.',
    image: '/images/autumn-itinerary.jpg',
    stay: 'Hotel 3★ Tokyo Area',
    meals: { breakfast: 'Hotel', lunch: 'Kamikochi Alpine Picnic', dinner: 'Tokyo Ramen Bar' },
    activities: [
      { time: '07:30', title: 'Matsumoto to Kamikochi Alpine Transfer', desc: 'Perjalanan menuju kawasan taman nasional Kamikochi yang terjaga murni.' },
      { time: '09:00', title: 'Taisho Pond to Kappa Bridge Walking Tour', desc: 'Jalan santai menyusuri tepian sungai jernih berlatar Gunung Hotaka.' },
      { time: '14:30', title: 'Transfer to Nagano Station', desc: 'Menuju stasiun kereta Shinkansen menuju ibu kota.' },
      { time: '17:00', title: 'Bullet Train Shinkansen to Tokyo', desc: 'Meluncur cepat menuju Tokyo, metropolis modern Jepang.' },
      { time: '19:30', title: 'Check-in Hotel Tokyo & Free Night Walk', desc: 'Menikmati kerlap-kerlip malam kota Tokyo.' },
    ],
  },
  {
    day: 7,
    date: '13 November 2026',
    title: 'Tokyo Aesthetic Spots, Vintage Shopping & Farewell Dinner',
    city: 'Tokyo',
    summary: 'Hari santai di sudut-sudut Tokyo yang aesthetic. Cafe hopping, belanja oleh-oleh, dan malam perpisahan bareng sahabat baru.',
    image: '/images/autumn-itinerary.jpg',
    stay: 'Hotel 3★ Tokyo Area',
    meals: { breakfast: 'Hotel', lunch: 'Tokyo Aesthetic Cafe', dinner: 'Farewell Circle Dinner' },
    activities: [
      { time: '10:00', title: 'Exploring Cozy & Cool Tokyo Spots', desc: 'Menemukan kedai kopi unik, toko vintage, dan sudut jalanan estetik.' },
      { time: '15:00', title: 'Souvenir & Shopping Time', desc: 'Waktu bebas berburu matcha, skincare, dan cinderamata khas Jepang.' },
      { time: '18:30', title: 'Farewell Dinner Bersama', desc: 'Makan malam penutupan mengenang 7 hari petualangan tak terlupakan.' },
    ],
  },
  {
    day: 8,
    date: '14 November 2026',
    title: 'Sayonara Japan! Packing & Flight Back to Jakarta',
    city: 'Tokyo ➔ Jakarta',
    summary: 'Persiapan checkout, transfer menuju bandara, dan penerbangan kembali ke tanah air membawa cerita dan sahabat baru seumur hidup.',
    image: '/images/winter-hero.jpg',
    stay: 'Home Sweet Home',
    meals: { breakfast: 'Hotel', lunch: 'Airport Dining', dinner: 'Flight' },
    activities: [
      { time: '08:30', title: 'Packing & Hotel Checkout', desc: 'Persiapan akhir barang bawaan dan kenang-kenangan.' },
      { time: '11:00', title: 'Transfer to Tokyo Airport (NRT/HND)', desc: 'Proses check-in tiket, bagasi, dan boarding penerbangan.' },
      { time: 'Selesai', title: 'Flight Tokyo to Jakarta', desc: 'Tiba kembali di Jakarta membawa sahabat seumur hidup.' },
    ],
  },
];

export default function InteractiveItineraryTimeline({
  days,
  batchTitle,
  destinationName,
  heroImage,
  included,
  excluded,
}: InteractiveItineraryTimelineProps) {
  const [activeDay, setActiveDay] = useState(1);

  const destinationImageFallback = () => {
    const s = `${destinationName} ${batchTitle}`.toLowerCase();
    if (s.includes('yunnan') || s.includes('china')) return '/images/destinations/china.jpg';
    if (s.includes('vietnam') || s.includes('sapa') || s.includes('dalat')) return '/images/destinations/vietnam.jpg';
    if (s.includes('kazakhstan') || s.includes('kyrgyzstan') || s.includes('central-asia')) return '/images/destinations/kazakhstan.jpg';
    if (s.includes('winter')) return '/images/winter-hero.jpg';
    return '/images/autumn-itinerary.jpg';
  };

  const itineraryDays = (days && days.length > 0)
    ? days.map((d, index) => {
        const dayNumber = d.day_no || d.day || (index + 1);
        let dateFormatted = d.date;
        if (!dateFormatted && d.local_date) {
          try {
            const dt = new Date(d.local_date);
            dateFormatted = dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          } catch {
            dateFormatted = d.local_date;
          }
        }
        if (!dateFormatted) dateFormatted = `Hari ke-${dayNumber}`;

        const acts = (d.activities || []).map((a) => ({
          time: a.start_local_time || a.time || '09:00',
          title: a.title,
          desc: a.details || a.desc || (a.location_name ? `Lokasi: ${a.location_name}` : ''),
        }));

        let cityStr = d.city;
        if (!cityStr) {
          if (acts.length > 0 && acts[0].desc && acts[0].desc.startsWith('Lokasi: ')) {
            cityStr = acts[0].desc.replace('Lokasi: ', '');
          } else if (d.title.includes('ke')) {
            cityStr = d.title.split('ke')[1]?.trim().split(' ')[0] || d.title.split(' ')[0];
          } else {
            cityStr = d.title.split(' ')[0];
          }
        }

        return {
          day: dayNumber,
          date: dateFormatted,
          title: d.title,
          city: cityStr || 'Perjalanan',
          summary: d.description || d.summary || '',
          image: d.image || heroImage || destinationImageFallback(),
          stay: d.stay || 'Hotel 3★ / Traditional Guesthouse / Setara',
          meals: typeof d.meals === 'object' && d.meals !== null ? d.meals : {
            breakfast: 'Hotel / Guesthouse',
            lunch: 'Resto Lokal Pilihan',
            dinner: 'Kuliner Otentik Khas Daerah'
          },
          activities: acts.length > 0 ? acts : [
            { time: '09:00', title: d.title, desc: d.description || 'Eksplorasi bersama circle perjalanan.' }
          ],
        };
      })
    : defaultJapanDays;

  const currentIdx = Math.min(Math.max(0, activeDay - 1), itineraryDays.length - 1);
  const current = itineraryDays[currentIdx];

  const inclusionsList = (included && included.length > 0)
    ? included
    : [
        'Tiket Pesawat PP Internasional (Khusus Full Package)',
        'Hotel Bintang 3 / Traditional Boutique Guesthouse (Twin Sharing)',
        'Transportasi Kereta Cepat / Bus Privat Ber-AC selama program',
        'Tiket Masuk Seluruh Destinasi Wisata & Aktivitas Sesuai Itinerary',
        'Konsumsi 3x Sehari (Kuliner Khas Lokal Otentik)',
        'Tour Leader VWS Berpengalaman & Guide Lokal Resmi',
        'Dokumentasi Foto & Video Perjalanan Kualitas Tinggi',
      ];

  const exclusionsList = (excluded && excluded.length > 0)
    ? excluded
    : [
        'Biaya Paspor & Visa (Tersedia Asistensi & Dokumen Pendukung Resmi)',
        'Asuransi Perjalanan Pribadi (Disarankan)',
        'Pengeluaran Pribadi & Belanja Cinderamata di luar Program',
        'Single Room Supplement (Bagi yang memilih kamar privat sendiri)',
      ];

  return (
    <section className="py-20 bg-[#FAF8F5] border-b border-black/5" id="itinerary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="max-w-2xl text-left space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4E38FF]">
            Itinerary Perjalanan • {itineraryDays.length} Hari {itineraryDays.length - 1} Malam
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#121113] tracking-tight">
            Rencana Perjalanan Harian
          </h2>

          <p className="font-body text-sm text-[#64748B]">
            {batchTitle
              ? `Rute perjalanan kurasi otentik untuk ${batchTitle} yang dirancang seimbang antara eksplorasi dan kenyamanan.`
              : 'Rute otentik menyusuri destinasi yang dirancang seimbang antara petualangan dan kenyamanan santai.'}
          </p>
        </div>

        {/* Day Selector Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
          {itineraryDays.map((d) => (
            <button
              key={d.day}
              type="button"
              onClick={() => setActiveDay(d.day)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                activeDay === d.day
                  ? 'bg-[#FD562A] text-white shadow-md'
                  : 'bg-white text-[#64748B] hover:text-[#121113] border border-black/5'
              }`}
            >
              <span>Day {d.day}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeDay === d.day ? 'bg-white/20 text-white' : 'bg-neutral-100 text-[#64748B]'
              }`}>
                {d.city.split('➔')[0].trim()}
              </span>
            </button>
          ))}
        </div>

        {/* Active Day Detail Presentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Visual Card with Stay & Meals */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-black/5 shadow-xs space-y-6">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-inner bg-neutral-100">
              <Image
                src={current.image}
                alt={current.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-bold">
                Day {current.day} • {current.date}
              </div>
            </div>

            {/* Day Logistics */}
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF8F5]">
                <Bed size={20} weight="fill" className="text-[#4E38FF] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#121113] block">Akomodasi Hotel</span>
                  <span className="text-[#64748B]">{current.stay}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FAF8F5]">
                <ForkKnife size={20} weight="fill" className="text-[#FD562A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#121113] block">Konsumsi / Meals</span>
                  <span className="text-[#64748B]">
                    {typeof current.meals === 'object' && current.meals !== null
                      ? `Pagi: ${current.meals.breakfast} • Siang: ${current.meals.lunch} • Malam: ${current.meals.dinner}`
                      : String(current.meals)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Activities Timeline */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#FD562A] block">
                {current.city} • {current.date}
              </span>
              <h3 className="font-display font-extrabold text-2xl text-[#121113] mt-1 leading-snug">
                {current.title}
              </h3>
              <p className="font-body text-sm text-[#64748B] mt-2 leading-relaxed">
                {current.summary}
              </p>
            </div>

            {/* Timeline Activities List */}
            <div className="space-y-4 pt-4 border-t border-black/5">
              {current.activities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-black/5 font-mono text-xs font-bold text-[#FD562A] shrink-0">
                    {act.time}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-base text-[#121113]">
                      {act.title}
                    </h4>
                    {act.desc && (
                      <p className="font-body text-xs sm:text-sm text-[#64748B] leading-relaxed">
                        {act.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Poster Inclusions & Exclusions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Inclusions */}
          <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#121113] font-display font-bold text-lg">
              <CheckCircle size={22} weight="fill" className="text-[#121113]" />
              <span>Biaya Sudah Termasuk (Include)</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#64748B]">
              {inclusionsList.map((inc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#121113] shrink-0 mt-1.5" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-neutral-700 font-display font-bold text-lg">
              <XCircle size={22} weight="bold" className="text-neutral-400" />
              <span>Biaya Belum Termasuk (Exclude)</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#64748B]">
              {exclusionsList.map((exc, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0 mt-1.5" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
