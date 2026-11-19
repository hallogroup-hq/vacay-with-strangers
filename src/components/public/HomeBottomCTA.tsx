'use client';

import React from 'react';
import Link from 'next/link';
import { WhatsappLogo, ArrowRight, Sparkle, ShieldCheck, UsersThree } from '@phosphor-icons/react';
import { OFFICIAL_WA_NUMBER } from '@/lib/whatsapp/generator';

interface HomeBottomCTAProps {
  config?: any;
}

export default function HomeBottomCTA({ config }: HomeBottomCTAProps = {}) {
  const waUrl = config?.primaryCtaUrl || `https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent('Halo Vacay With Strangers! Aku mau tanya ketersediaan slot trip dan skema cicilannya ya.')}`;
  const badgeText = config?.badge || 'Siap Melangkah?';
  const headline = config?.title || 'Dunia Terlalu Luas untuk Ditunggu Sendirian.';
  const description = config?.description || 'Tak perlu menunda petualangan karena teman yang wacana. Gabung di circle kecil VWS, nikmati rute otentik dunia, dan pulang dengan sahabat baru seumur hidup.';
  const primaryCta = config?.primaryCtaText || 'Konsultasi Slot via WhatsApp';
  const secondaryCta = config?.secondaryCtaText || 'Jelajahi Semua Batch';
  const secondaryUrl = config?.secondaryCtaUrl || '/trips';

  return (
    <section className="py-20 lg:py-28 bg-[#121113] text-white relative overflow-hidden" id="contact">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#4E38FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FD562A]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-10">
        
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono uppercase tracking-widest text-[#D4FF00] border border-white/10">
            <Sparkle size={14} weight="fill" />
            <span>{badgeText}</span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.08]">
            {headline}
          </h2>

          <p className="font-body text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* 3 Reassurance Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-300 font-medium">
          <div className="flex items-center gap-2">
            <UsersThree size={18} weight="bold" className="text-[#4E38FF]" />
            <span>Maksimal 12 Pax per Batch</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkle size={18} weight="bold" className="text-[#FD562A]" />
            <span>90% Berangkat Solo</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} weight="bold" className="text-[#D4FF00]" />
            <span>Cicilan Transparan s/d H-30</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 px-8 py-4 rounded-full bg-[#FD562A] hover:bg-[#e0441a] text-white font-display font-bold text-sm tracking-wide shadow-lg hover:shadow-2xl transition-all duration-300 active:scale-95 group"
          >
            <span>Konsultasi Slot via WhatsApp</span>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <WhatsappLogo size={18} weight="fill" />
            </div>
          </a>

          <Link
            href={secondaryUrl}
            className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-4 px-8 py-4 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 font-display font-bold text-sm tracking-wide transition-all active:scale-95 group"
          >
            <span>{secondaryCta}</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight size={16} weight="bold" />
            </div>
          </Link>
        </div>

      </div>
    </section>
  );
}
