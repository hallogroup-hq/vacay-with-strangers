'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarBlank, MapPin, ArrowRight, Users } from '@phosphor-icons/react';
import { formatIDR } from '@/lib/whatsapp/generator';

interface BatchItem {
  batch_id: string;
  series_slug: string;
  batch_slug: string;
  destination_name: string;
  destination_slug: string;
  country_code: string;
  series_name: string;
  series_season?: string;
  title: string;
  lead?: string;
  route_summary?: string;
  departure_date: string;
  return_date: string;
  capacity: number;
  remaining_seats: number;
  effective_status: string;
  price_from?: number;
  list_price_idr?: number;
  promo_price_idr?: number;
  hero_image_url?: string;
}

interface ExploreTripsCatalogProps {
  batches: BatchItem[];
  config?: any;
}

function formatDateRange(d1: string | Date | undefined, d2: string | Date | undefined) {
  if (!d1) return '';
  const s1 = typeof d1 === 'string' ? d1 : d1.toISOString().slice(0, 10);
  const [y1, m1, day1] = s1.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, day1);

  if (!d2) return dt1.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const s2 = typeof d2 === 'string' ? d2 : d2.toISOString().slice(0, 10);
  const [y2, m2, day2] = s2.split('-').map(Number);
  const dt2 = new Date(y2, m2 - 1, day2);

  return `${dt1.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${dt2.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export default function ExploreTripsCatalog({ batches, config }: ExploreTripsCatalogProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const countries = [
    { code: 'all', label: 'Semua Destinasi' },
    { code: 'JP', label: 'Jepang (Autumn & Winter)' },
    { code: 'CN', label: 'China (Yunnan)' },
    { code: 'VN', label: 'Vietnam (Hanoi & Da Nang)' },
    { code: 'KZ', label: 'Central Asia (Kazakhstan & Kyrgyzstan)' },
  ];

  const filteredBatches = selectedCountry === 'all'
    ? batches
    : batches.filter((b) => b.country_code === selectedCountry);

  const getHeroImage = (batch: BatchItem) => {
    if (batch.series_slug === 'japan-winter') return '/images/winter-hero.jpg';
    if (batch.country_code === 'CN') return '/images/destinations/china.jpg';
    if (batch.country_code === 'VN') return '/images/destinations/vietnam.jpg';
    if (batch.country_code === 'KZ') return '/images/destinations/kazakhstan.jpg';
    return batch.hero_image_url || '/images/autumn-hero.jpg';
  };

  return (
    <section className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-black/5" id="explore-trips">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#FD562A]">
              {config?.badge || 'Jadwal & Rute Terkurasi'}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight leading-tight">
              {config?.title || 'Upcoming Trip Batches'}
            </h2>
            <p className="font-body text-base text-[#64748B]">
              {config?.description || 'Pilih petualanganmu berikutnya. Seluruh trip dibatasi maksimal 10–12 pax untuk menjaga keintiman circle dan pengalaman autentik.'}
            </p>
          </div>

          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#121113] hover:text-[#4E38FF] transition-colors shrink-0 group"
          >
            <span>Buka Seluruh Direktori</span>
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setSelectedCountry(c.code)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wide whitespace-nowrap transition-all duration-200 ${
                selectedCountry === c.code
                  ? 'bg-[#121113] text-white shadow-xs'
                  : 'bg-white text-[#64748B] hover:text-[#121113] border border-black/5'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Trips Grid: Double-Bezel Nested Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBatches.map((batch) => {
            const isComingSoon = batch.effective_status === 'coming_soon';
            const isFull = batch.effective_status === 'fully_booked' || batch.remaining_seats <= 0;
            const heroImg = getHeroImage(batch);

            return (
              <div
                key={batch.batch_id}
                className="group rounded-[2rem] p-2 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300 flex flex-col"
              >
                <div className="rounded-[calc(2rem-0.5rem)] overflow-hidden bg-white shadow-xs flex flex-col justify-between h-full">
                  <div>
                    {/* Image Header */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                      <Image
                        src={heroImg}
                        alt={batch.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-bold">
                        {batch.destination_name}
                      </div>
                      {isComingSoon ? (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-mono uppercase tracking-wider">
                          Coming Soon
                        </div>
                      ) : isFull ? (
                        <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider">
                          Fully Booked
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white text-[#121113] text-[10px] font-mono font-bold uppercase shadow-xs">
                          {batch.remaining_seats} Seats Tersedia
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-[#64748B] font-medium">
                        <CalendarBlank size={16} weight="bold" />
                        <span>{formatDateRange(batch.departure_date, batch.return_date)}</span>
                      </div>

                      <h3 className="font-display font-extrabold text-xl text-[#121113] group-hover:text-[#4E38FF] transition-colors leading-snug">
                        {batch.title}
                      </h3>

                      <p className="font-body text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {batch.lead || batch.route_summary || 'Eksplorasi autentik bersama circle kecil yang menyenangkan.'}
                      </p>

                      <div className="pt-2 flex items-center gap-3 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users size={15} weight="bold" />
                          <span>Max {batch.capacity} pax</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 pb-6 pt-3 border-t border-black/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                        Investasi Mulai
                      </span>
                      <span className="font-display font-black text-base text-[#121113]">
                        {formatIDR(batch.price_from || 15000000)}
                      </span>
                    </div>

                    <Link
                      href={`/trips/${batch.series_slug}/${batch.batch_slug}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#121113] group-hover:bg-[#4E38FF] text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Detail Batch</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
