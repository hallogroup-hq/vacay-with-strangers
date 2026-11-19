'use client';

import React from 'react';
import { UsersThree, Compass, ShieldCheck, Handshake, Sparkle } from '@phosphor-icons/react';

interface TravelClubPremiseProps {
  config?: any;
}

export default function TravelClubPremise({ config }: TravelClubPremiseProps = {}) {
  const defaultPillars = [
    {
      num: '01',
      title: 'Circle Kecil (Max 10–12 Pax)',
      desc: 'Bukan tur rombongan 40 orang yang kaku dan dikejar waktu. Skala grup yang intim bikin semua traveler akrab dan terasa seperti liburan bareng sahabat.',
      icon: UsersThree,
    },
    {
      num: '02',
      title: '90% Berangkat Sendirian',
      desc: 'Nggak perlu nungguin teman yang sering wacana. Mayoritas peserta daftar solo dan langsung menemukan circle baru yang sefrekuensi sejak hari pertama.',
      icon: Handshake,
    },
    {
      num: '03',
      title: 'Rute Pedesaan & Hidden Spots',
      desc: 'Dari desa tradisional, onsen pegunungan, keindahan alam, hingga kuliner lokal autentik yang nggak akan kamu temukan di paket tur biasa.',
      icon: Compass,
    },
    {
      num: '04',
      title: 'Skema Cicilan Transparan H-30',
      desc: 'DP ringan dan cicilan bulanan flat tanpa bunga sampai H-30 keberangkatan. Tanpa biaya siluman dan tanpa paksaan belanja ke toko turis.',
      icon: ShieldCheck,
    },
  ];

  const pillars = config?.items && config.items.length > 0
    ? config.items.map((it: any, idx: number) => ({
        num: String(idx + 1).padStart(2, '0'),
        title: it.title,
        desc: it.description || it.subtitle || '',
        icon: idx === 0 ? UsersThree : idx === 1 ? Handshake : idx === 2 ? Compass : ShieldCheck,
      }))
    : defaultPillars;

  const badgeText = config?.badge || 'The Strangers Premise';
  const headline = config?.title || 'Kenapa Menjelajahi Dunia Bareng Orang Baru Lebih Berkesan?';
  const description = config?.description || 'Vacay With Strangers memadukan kebebasan solo travel dengan kehangatan komunitas kecil. Kamu bebas menikmati dunia tanpa beban kecanggungan atau drama teman yang wacana.';
  const guaranteeTitle = config?.customConfig?.guaranteeTitle || 'Zero Awkwardness Guarantee';
  const guaranteeText = config?.customConfig?.guaranteeText || '90% peserta mendaftar sendirian tanpa kenal siapa pun. Dalam beberapa jam pertama, kecanggungan mencair secara organik menjadi percakapan hangat yang tulus.';

  return (
    <section className="py-20 lg:py-28 bg-white border-b border-black/5" id="premise">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Split Layout: Left Story + Right 2x2 Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: The Narrative */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4E38FF]">
              {badgeText}
            </div>

            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight leading-tight">
              {headline}
            </h2>

            <p className="font-body text-base text-[#64748B] leading-relaxed">
              {description}
            </p>

            <div className="p-6 rounded-[2rem] bg-[#FAF8F5] border border-black/5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FD562A]">
                <Sparkle size={16} weight="fill" />
                <span>{guaranteeTitle}</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                {guaranteeText}
              </p>
            </div>
          </div>

          {/* Right Column: 2x2 Double-Bezel Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {pillars.map((pillar: any) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.num}
                  className="rounded-[2rem] p-2 bg-black/5 ring-1 ring-black/5 hover:ring-black/15 transition-all duration-300 group"
                >
                  <div className="rounded-[calc(2rem-0.5rem)] bg-white p-6 sm:p-7 flex flex-col justify-between h-full space-y-6 shadow-xs">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] border border-black/5 text-[#121113] flex items-center justify-center font-bold shadow-xs group-hover:bg-[#121113] group-hover:text-white transition-all duration-300">
                          <Icon size={24} weight="bold" />
                        </div>
                        <span className="font-mono text-xs font-bold text-neutral-400">
                          {pillar.num}
                        </span>
                      </div>

                      <h3 className="font-display font-extrabold text-lg text-[#121113] leading-snug">
                        {pillar.title}
                      </h3>

                      <p className="font-body text-xs text-[#64748B] leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs font-mono font-bold text-neutral-400">
                      <span>Curated Standard</span>
                      <span className="text-[10px] uppercase tracking-wider text-[#FD562A]">VWS Club</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
