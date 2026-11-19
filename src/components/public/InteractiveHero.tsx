'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { WhatsappLogo, ArrowRight, MapPin, Users, CalendarBlank, Compass } from '@phosphor-icons/react';
import { OFFICIAL_WA_NUMBER, formatIDR } from '@/lib/whatsapp/generator';

interface InteractiveHeroProps {
  config?: any;
}

export default function InteractiveHero({ config }: InteractiveHeroProps = {}) {
  const waUrl = config?.secondaryCtaUrl || `https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent('Halo Vacay With Strangers! Aku mau tanya jadwal dan ketersediaan slot trip ya.')}`;
  const badgeText = config?.badge || 'Curated Open-Trip Travel Club';
  const headline = config?.title || 'Travel with Strangers. Come Home with Friends.';
  const description = config?.description || 'Bukan rombongan tur 40 orang yang kaku. Kami mengkurasi perjalanan circle kecil (maksimal 10–12 pax) untuk solo traveler, Gen Z, dan first-jobber menikmati rute autentik dunia secara hangat, santai, dan tanpa rasa canggung.';
  const primaryCta = config?.primaryCtaText || 'Jelajahi Jadwal Perjalanan';
  const primaryUrl = config?.primaryCtaUrl || '#explore-trips';
  const secondaryCta = config?.secondaryCtaText || 'Tanya Admin';

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-12 lg:pb-20 border-b border-black/5 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 2-Column Split: Editorial Value Prop + Featured Curated Journey */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Editorial Headline & Value Proposition */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#FD562A]">
              {badgeText}
            </div>

            <h1 className="font-display font-black text-4xl sm:text-5xl lg:text-[3.85rem] text-[#121113] tracking-tight leading-[1.04]">
              {headline}
            </h1>

            <p className="font-body text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
              {description}
            </p>

            {/* Key Trip Values - Minimal Editorial Strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1 text-xs sm:text-sm font-medium text-[#121113]">
              <div className="flex items-center gap-2">
                <Users size={18} weight="bold" className="text-[#4E38FF] shrink-0" />
                <span>Circle Kecil (Max 12 Pax)</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass size={18} weight="bold" className="text-[#FD562A] shrink-0" />
                <span>90% Berangkat Solo</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarBlank size={18} weight="bold" className="text-[#121113] shrink-0" />
                <span>Cicilan Flat s/d H-30</span>
              </div>
            </div>

            {/* Action Buttons: Button-in-Button Trailing Architecture */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href={primaryUrl}
                className="inline-flex items-center justify-between sm:justify-center gap-4 px-8 py-4 rounded-full bg-[#121113] hover:bg-[#4E38FF] text-white font-display font-bold text-sm tracking-wide shadow-md hover:shadow-xl transition-all duration-300 active:scale-95 group"
              >
                <span>{primaryCta}</span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <ArrowRight size={16} weight="bold" />
                </div>
              </a>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between sm:justify-center gap-3 px-7 py-4 rounded-full bg-white hover:bg-neutral-50 text-[#121113] border border-black/10 text-sm font-bold tracking-wide shadow-xs hover:shadow-md transition-all active:scale-95 group"
              >
                <span>{secondaryCta}</span>
                <div className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <WhatsappLogo size={18} weight="fill" />
                </div>
              </a>
            </div>
          </div>

          {/* Right Column: Featured Trip Double-Bezel Card */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <Link
              href="/trips/japan-autumn/batch-01-nov-2026"
              className="group block w-full max-w-md rounded-[2.5rem] p-2.5 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 shadow-2xl transition-all duration-300"
            >
              <div className="rounded-[calc(2.5rem-0.625rem)] overflow-hidden bg-white shadow-sm flex flex-col">
                {/* Image Header */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                  <Image
                    src="/images/autumn-hero.jpg"
                    alt="Vacay With Strangers Japan Autumn 2026"
                    fill
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
                    Featured Journey
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white text-[#121113] text-[11px] font-bold shadow-xs">
                    5 Seats Tersedia
                  </div>
                </div>

                {/* Card Editorial Details */}
                <div className="p-6 sm:p-7 space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#FD562A]">
                      Jepang • Autumn 2026 (8D7N)
                    </div>
                    <h3 className="font-display font-black text-xl sm:text-2xl text-[#121113] group-hover:text-[#4E38FF] transition-colors leading-snug">
                      Japan Countryside Edition
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Osaka ➔ Nagoya ➔ Gifu ➔ Suwa Lake ➔ Nagano ➔ Tokyo
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                        Investasi Mulai
                      </span>
                      <span className="font-display font-black text-lg text-[#121113]">
                        {formatIDR(15000000)}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#121113] group-hover:bg-[#4E38FF] text-white text-xs font-bold transition-all shadow-xs">
                      <span>Detail Batch</span>
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
