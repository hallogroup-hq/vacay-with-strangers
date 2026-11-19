'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarBlank,
  Clock,
  MapPin,
  UsersThree,
  CheckCircle,
  XCircle,
  WhatsappLogo,
  ShieldCheck,
  Sparkle,
  ArrowRight,
  Info,
  Warning,
  Bed,
  ForkKnife,
  AirplaneTilt,
  CaretDown,
  CaretUp,
  Plus,
  Minus
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { formatIDR, OFFICIAL_WA_NUMBER } from '@/lib/whatsapp/generator';
import InteractiveBoardingPass from '@/components/public/InteractiveBoardingPass';
import InteractiveItineraryTimeline from '@/components/public/InteractiveItineraryTimeline';

interface BatchDetailProps {
  batch: any;
}

export default function BatchDetailInteractive({ batch }: BatchDetailProps) {
  const [openPolicy, setOpenPolicy] = useState<number | null>(null);

  const daysCount = batch.days?.length || 8;
  const nightsCount = Math.max(1, daysCount - 1);

  const policies = [
    {
      title: 'Kebijakan Booking Seat & Down Payment (DP)',
      desc: 'DP sebesar Rp 1.500.000 per traveler bersifat mengikat untuk reservasi seat resmi. Karena kuota dibatasi maksimal 12 traveler, DP tidak dapat dikembalikan (non-refundable) jika pembatalan sepihak dilakukan oleh traveler.',
    },
    {
      title: 'Aturan Cicilan & Batas Pelunasan H-30',
      desc: 'Sisa pembayaran setelah DP dicicil setiap bulan secara transparan. Traveler bebas memilih tanggal setor dalam bulan berjalan. Seluruh kewajiban pembayaran wajib lunas paling lambat 30 hari sebelum tanggal keberangkatan (H-30).',
    },
    {
      title: 'Kebijakan Reschedule (Pindah Batch)',
      desc: 'Pengajuan pindah jadwal (reschedule) dilayani paling lambat H-45 sebelum tanggal keberangkatan, dengan syarat batch tujuan masih memiliki seat kosong dan disetujui admin resmi VWS.',
    },
    {
      title: `Persyaratan Paspor & Visa ${batch.destination_name || 'Tujuan'}`,
      desc: `Masa berlaku paspor minimal 6 bulan dari tanggal kepulangan. Tim VWS menyediakan panduan lengkap dan berkas pendukung resmi (itinerary dan bukti akomodasi) untuk pengajuan visa ${batch.destination_name || 'tujuan'}.`,
    },
  ];

  return (
    <div className="space-y-16 pb-24">
      {/* =========================================================================
          1. EDITORIAL HEADER & HERO BANNER
      ========================================================================== */}
      <section className="bg-white border-b border-black/5 pt-8 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs font-bold text-[#64748B]">
            <Link href="/" className="hover:text-[#121113] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/trips" className="hover:text-[#121113] transition-colors">Trips</Link>
            <span>/</span>
            <span className="text-[#121113]">{batch.series_name || 'Trip Series'}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-wider text-[#64748B]">
                <span>{batch.destination_name || 'Destination'}</span>
                <span>•</span>
                <span>{batch.series_season || 'Expedition'}</span>
                <span>•</span>
                <span className="text-[#FD562A]">{batch.remaining_seats ?? 5} Seats Tersedia</span>
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight leading-tight">
                {batch.title || 'Petualangan Bersama Vacay With Strangers'}
              </h1>

              <p className="font-body text-base text-[#64748B]">
                {batch.tagline || 'Eksplorasi destinasi memukau bareng circle baru yang sefrekuensi.'}
              </p>
            </div>

            {/* Quick Specs */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-[#121113] bg-[#FAF8F5] p-4 rounded-2xl border border-black/5">
              <div className="flex items-center gap-2">
                <CalendarBlank size={18} weight="bold" className="text-[#FD562A]" />
                <span>{batch.departure_date} – {batch.return_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={18} weight="bold" className="text-[#4E38FF]" />
                <span>{daysCount} Hari {nightsCount} Malam</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersThree size={18} weight="bold" className="text-[#121113]" />
                <span>Max {batch.capacity || 12} Pax</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. INTERACTIVE ITINERARY TIMELINE
      ========================================================================== */}
      <InteractiveItineraryTimeline
        days={batch.days}
        batchTitle={batch.title}
        destinationName={batch.destination_name}
        heroImage={batch.hero_image_url}
        included={batch.price_options?.[0]?.included_json}
        excluded={batch.price_options?.[0]?.excluded_json}
      />

      {/* =========================================================================
          3. THE INTERACTIVE BOARDING PASS & INSTALLMENT SIMULATOR
      ========================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4E38FF]">
            Skema Biaya & Cicilan
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-[#121113] tracking-tight">
            Pilihan Paket & Kalkulator Cicilan
          </h2>
          <p className="font-body text-xs sm:text-sm text-[#64748B]">
            Sesuaikan jumlah traveler dan lihat rincian tagihan resmi sampai H-30.
          </p>
        </div>

        <InteractiveBoardingPass
          batchCode={batch.batch_code || 'AUTUMN-2026'}
          seriesSlug={batch.series_slug || 'japan-autumn'}
          batchSlug={batch.batch_slug || 'batch-01-nov-2026'}
          seriesName={batch.series_name || batch.title}
          batchTitle={batch.title}
          destinationName={batch.destination_name}
          departureDate={batch.departure_date || '2026-11-07'}
          returnDate={batch.return_date || '2026-11-14'}
          h30Date={batch.h30_date || '2026-10-08'}
          capacity={batch.capacity || 12}
          remainingSeats={batch.remaining_seats ?? 5}
          priceOptions={batch.price_options}
        />
      </section>

      {/* =========================================================================
          4. TRIP POLICIES & TRANSPARENCY ACCORDIONS
      ========================================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#64748B] block">
            Ketentuan & Transparansi
          </span>
          <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-[#121113]">
            Kebijakan Perjalanan
          </h3>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Seluruh aturan operasional dibuat jelas di awal untuk kenyamanan seluruh peserta.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          {policies.map((p, idx) => {
            const isOpen = openPolicy === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-black/5 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenPolicy(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-display font-bold text-base text-[#121113] hover:text-[#4E38FF] transition-colors"
                >
                  <span>{p.title}</span>
                  {isOpen ? <CaretUp size={18} weight="bold" /> : <CaretDown size={18} weight="bold" />}
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-[#64748B] leading-relaxed border-t border-black/5 pt-3"
                    >
                      {p.desc}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
