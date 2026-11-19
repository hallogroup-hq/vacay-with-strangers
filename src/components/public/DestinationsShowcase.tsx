'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Compass, Sparkle } from '@phosphor-icons/react';

interface DestinationItem {
  id: string;
  name: string;
  slug: string;
  country_code: string;
  summary: string;
  image: string;
  editions: string;
  status: string;
  badge?: string;
}

interface DestinationsShowcaseProps {
  config?: any;
}

export default function DestinationsShowcase({ config }: DestinationsShowcaseProps = {}) {
  const defaultDestinations: DestinationItem[] = [
    {
      id: 'jp',
      name: 'Jepang (Japan)',
      slug: '/trips?country=JP',
      country_code: 'JP',
      summary: 'Dari pesona gugur pedesaan Nagano dan lembah Kamikochi, hingga salju magis Shirakawa-go.',
      image: '/images/autumn-hero.jpg',
      editions: 'Autumn Countryside • Winter Snow • Spring Edition',
      status: 'Batch Aktif 2026',
      badge: 'Open Batch',
    },
    {
      id: 'cn',
      name: 'China: Mystical Yunnan',
      slug: '/trips/china-yunnan/batch-01-may-2027',
      country_code: 'CN',
      summary: 'Bersepeda di tepi danau Erhai, menatap puncak salju Jade Dragon Snow Mountain, dan menyusuri ngarai Tiger Leaping Gorge.',
      image: '/images/destinations/china.jpg',
      editions: 'Kunming • Dali • Lijiang • Shangri-La',
      status: 'Upcoming 2027',
      badge: 'Curated Route',
    },
    {
      id: 'vn',
      name: 'Vietnam: Hanoi & Sapa',
      slug: '/trips/vietnam-hanoi-sapa/batch-01-hanoi-apr-2027',
      country_code: 'VN',
      summary: 'Kabut mistis perbukitan Sapa, trekking terasering sawah, dan menaklukkan puncak atap Indochina Fansipan 3.143m.',
      image: '/images/destinations/vietnam.jpg',
      editions: 'Highlands & Fansipan Expedition',
      status: 'Upcoming 2027',
      badge: 'Curated Route',
    },
    {
      id: 'kz',
      name: 'Kazakhstan & Kyrgyzstan',
      slug: '/trips/kazakhstan-kyrgyzstan/batch-01-jul-2027',
      country_code: 'KZ',
      summary: 'Bentang alam liar Asia Tengah: kemegahan Ngarai Charyn, danau tenggelam Kaindy, dan bermalam di Yurt tepi Issyk-Kul.',
      image: '/images/destinations/kazakhstan.jpg',
      editions: 'Silk Road & Steppes Expedition',
      status: 'New Expedition',
      badge: 'New Expedition',
    },
  ];

  const destinations: DestinationItem[] = (config?.items && config.items.length >= 4)
    ? config.items.map((item: any, idx: number) => ({
        id: item.id || `dest_${idx}`,
        name: item.title || defaultDestinations[idx]?.name || '',
        slug: item.linkUrl || defaultDestinations[idx]?.slug || '/trips',
        country_code: item.countryCode || defaultDestinations[idx]?.country_code || 'ID',
        summary: item.description || defaultDestinations[idx]?.summary || '',
        image: item.imageUrl || defaultDestinations[idx]?.image || '/images/autumn-hero.jpg',
        editions: item.subtitle || defaultDestinations[idx]?.editions || '',
        status: item.badge || defaultDestinations[idx]?.status || 'Curated',
        badge: item.badge || defaultDestinations[idx]?.badge || 'Curated Route',
      }))
    : defaultDestinations;

  return (
    <section className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-black/5" id="destinations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#FD562A]">
              {config?.badge || 'Where We Wander'}
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight leading-tight">
              {config?.title || 'Eksplorasi Destinasi Dunia'}
            </h2>
            <p className="font-body text-base text-[#64748B] leading-relaxed">
              {config?.description || 'Bukan cuma satu trip. VWS mengkurasi rute-rute otentik di Asia dan dunia dengan circle kecil yang intim. Temukan petualangan favoritmu.'}
            </p>
          </div>

          <Link
            href="/trips"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#121113] hover:text-[#4E38FF] transition-colors shrink-0 group"
          >
            <span>Lihat Semua Jadwal Batch</span>
            <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Featured Large Card: Japan (Span 7) */}
          <Link
            href="/trips?country=JP"
            className="md:col-span-7 group relative rounded-[2rem] p-2 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300"
          >
            <div className="relative h-full min-h-[360px] sm:min-h-[420px] rounded-[calc(2rem-0.5rem)] overflow-hidden bg-neutral-900 flex flex-col justify-end p-6 sm:p-8">
              <Image
                src={destinations[0].image}
                alt={destinations[0].name}
                fill
                className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, 700px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10 space-y-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                    {destinations[0].badge}
                  </span>
                  <span className="text-xs font-mono text-white/80">
                    {destinations[0].status}
                  </span>
                </div>

                <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {destinations[0].name}
                </h3>

                <p className="font-body text-xs sm:text-sm text-neutral-300 max-w-lg leading-relaxed">
                  {destinations[0].summary}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/15">
                  <span className="text-[11px] font-mono text-[#D4FF00] font-bold">
                    {destinations[0].editions}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#4E38FF] text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Secondary Card: China (Span 5) */}
          <Link
            href="/trips?country=CN"
            className="md:col-span-5 group relative rounded-[2rem] p-2 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300"
          >
            <div className="relative h-full min-h-[360px] sm:min-h-[420px] rounded-[calc(2rem-0.5rem)] overflow-hidden bg-neutral-900 flex flex-col justify-end p-6 sm:p-8">
              <Image
                src={destinations[1].image}
                alt={destinations[1].name}
                fill
                className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, 500px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10 space-y-3 text-white">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/20">
                    {destinations[1].badge}
                  </span>
                </div>

                <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                  {destinations[1].name}
                </h3>

                <p className="font-body text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {destinations[1].summary}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/15">
                  <span className="text-[11px] font-mono text-neutral-300 font-bold">
                    {destinations[1].editions}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#4E38FF] text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Bottom Card 1: Vietnam (Span 6) */}
          <Link
            href="/trips?country=VN"
            className="md:col-span-6 group relative rounded-[2rem] p-2 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300"
          >
            <div className="relative h-full min-h-[300px] sm:min-h-[340px] rounded-[calc(2rem-0.5rem)] overflow-hidden bg-neutral-900 flex flex-col justify-end p-6 sm:p-8">
              <Image
                src={destinations[2].image}
                alt={destinations[2].name}
                fill
                className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10 space-y-2 text-white">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 inline-block">
                  {destinations[2].badge}
                </span>

                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                  {destinations[2].name}
                </h3>

                <p className="font-body text-xs text-neutral-300 leading-relaxed">
                  {destinations[2].summary}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/15">
                  <span className="text-[11px] font-mono text-neutral-300">
                    {destinations[2].editions}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#4E38FF] text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Bottom Card 2: Kazakhstan (Span 6) */}
          <Link
            href="/trips?country=KZ"
            className="md:col-span-6 group relative rounded-[2rem] p-2 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300"
          >
            <div className="relative h-full min-h-[300px] sm:min-h-[340px] rounded-[calc(2rem-0.5rem)] overflow-hidden bg-neutral-900 flex flex-col justify-end p-6 sm:p-8">
              <Image
                src={destinations[3].image}
                alt={destinations[3].name}
                fill
                className="object-cover opacity-80 group-hover:scale-105 group-hover:opacity-90 transition-all duration-700"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="relative z-10 space-y-2 text-white">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white border border-white/20 inline-block">
                  {destinations[3].badge}
                </span>

                <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                  {destinations[3].name}
                </h3>

                <p className="font-body text-xs text-neutral-300 leading-relaxed">
                  {destinations[3].summary}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/15">
                  <span className="text-[11px] font-mono text-neutral-300">
                    {destinations[3].editions}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-[#4E38FF] text-white flex items-center justify-center transition-colors">
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </div>
              </div>
            </div>
          </Link>

        </div>

      </div>
    </section>
  );
}
