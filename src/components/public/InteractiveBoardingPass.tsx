'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  AirplaneTilt, 
  Calendar, 
  Users, 
  CreditCard, 
  WhatsappLogo, 
  CheckCircle, 
  Sparkle, 
  Info, 
  CaretDown, 
  CaretUp,
  Plus,
  Minus
} from '@phosphor-icons/react';
import { OFFICIAL_WA_NUMBER, generateWhatsAppUrl, formatIDR } from '@/lib/whatsapp/generator';
import { calculateInstallmentSchedule } from '@/lib/finance/installments';
import { SmileySunglassesSticker, ThumbsUpSticker } from '@/components/brand/Stickers';

export interface InteractiveBoardingPassProps {
  batchCode?: string;
  seriesSlug?: string;
  batchSlug?: string;
  seriesName?: string;
  batchTitle?: string;
  destinationName?: string;
  departureDate?: string;
  returnDate?: string;
  h30Date?: string;
  capacity?: number;
  remainingSeats?: number;
  priceOptions?: Array<{
    package_type: string;
    display_name: string;
    list_price_idr: string | number;
    promo_price_idr?: string | number;
    effective_price_idr: string | number;
    dp_per_traveler_idr?: string | number;
    is_promo_active?: boolean;
    included_json?: string[];
    excluded_json?: string[];
  }>;
}

export default function InteractiveBoardingPass({
  batchCode = 'AUTUMN-2026',
  seriesSlug = 'japan-autumn',
  batchSlug = 'batch-01-nov-2026',
  seriesName = 'Japan Countryside & Golden Autumn',
  batchTitle = 'Japan Countryside Autumn Trip (8D7N)',
  destinationName = 'Japan',
  departureDate = '2026-11-07',
  returnDate = '2026-11-14',
  h30Date = '2026-10-08',
  capacity = 12,
  remainingSeats = 5,
  priceOptions,
}: InteractiveBoardingPassProps) {
  // Interactive State
  const [packageType, setPackageType] = useState<'full' | 'land'>('full');
  const [headcount, setHeadcount] = useState(1);
  const [showSchedule, setShowSchedule] = useState(true);

  // Dynamic pricing from DB or fallback
  const fullOffer = priceOptions?.find((o) => o.package_type === 'full') || priceOptions?.[0];
  const landOffer = priceOptions?.find((o) => o.package_type === 'land_only' || o.package_type === 'land') || priceOptions?.[1];

  const fullPackagePrice = fullOffer ? Number(fullOffer.effective_price_idr) : 21000000;
  const fullPackageNormalPrice = fullOffer ? Number(fullOffer.list_price_idr) : 24000000;
  const landTourPrice = landOffer ? Number(landOffer.effective_price_idr) : 14500000;
  const landTourNormalPrice = landOffer ? Number(landOffer.list_price_idr) : 16500000;
  const dpAmount = fullOffer?.dp_per_traveler_idr ? Number(fullOffer.dp_per_traveler_idr) : 1500000;

  const currentPricePerTraveler = packageType === 'full' ? fullPackagePrice : landTourPrice;
  const currentNormalPrice = packageType === 'full' ? fullPackageNormalPrice : landTourNormalPrice;

  // Real installment calculation based on H-30 logic
  const simulation = calculateInstallmentSchedule({
    departureDate,
    effectivePriceIdr: currentPricePerTraveler,
    dpPerTravelerIdr: dpAmount,
    headcount,
    now: new Date('2026-10-01T00:00:00Z'),
    isOfficial: true,
  });

  const handleConfetti = () => {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#FD562A', '#D4FF00', '#4E38FF'],
    });
  };

  const handleIncrement = () => {
    if (headcount < remainingSeats) {
      setHeadcount((prev) => prev + 1);
      handleConfetti();
    }
  };

  const handleDecrement = () => {
    if (headcount > 1) {
      setHeadcount((prev) => prev - 1);
    }
  };

  // Build WhatsApp URL
  const waUrl = generateWhatsAppUrl({
    seriesName: seriesName || batchTitle,
    batchCode,
    dateRange: `${departureDate} s/d ${returnDate}`,
    packageName: packageType === 'full' ? 'Full Package (Flight + Land)' : 'Land Tour Only',
    headcount,
    installmentTenorMonths: simulation.tenor_months,
    monthlyAmountIdr: simulation.monthly_amount_idr,
  });

  // Dynamic route specs
  const getRouteInfo = () => {
    const s = `${seriesSlug} ${destinationName} ${batchTitle}`.toLowerCase();
    if (s.includes('yunnan') || s.includes('china')) {
      return { route: 'Kunming ➔ Shangri-La', via: 'Via Dali, Lijiang & Tiger Leaping Gorge' };
    }
    if (s.includes('danang') || s.includes('dalat')) {
      return { route: 'Da Nang ➔ Da Lat', via: 'Via Hoi An & Dataran Tinggi Da Lat' };
    }
    if (s.includes('vietnam') || s.includes('hanoi') || s.includes('sapa')) {
      return { route: 'Hanoi ➔ Sapa', via: 'Via Fansipan Peak & Trang An' };
    }
    if (s.includes('kazakhstan') || s.includes('kyrgyzstan') || s.includes('central-asia')) {
      return { route: 'Almaty ➔ Bishkek', via: 'Via Charyn Canyon, Kaindy & Issyk-Kul' };
    }
    if (s.includes('winter')) {
      return { route: 'Tokyo ➔ Nagano', via: 'Via Shirakawa-go & Winter Alps' };
    }
    return { route: 'Osaka ➔ Tokyo', via: 'Via Gifu, Suwa & Nagano' };
  };

  const routeInfo = getRouteInfo();

  const formatDateRange = (dep?: string, ret?: string) => {
    if (!dep || !ret) return 'Jadwal Terkonfirmasi';
    try {
      const d1 = new Date(dep);
      const d2 = new Date(ret);
      const day1 = d1.getDate().toString().padStart(2, '0');
      const day2 = d2.getDate().toString().padStart(2, '0');
      const month = d2.toLocaleDateString('id-ID', { month: 'short' });
      const year = d2.getFullYear();
      return `${day1}–${day2} ${month} ${year}`;
    } catch {
      return `${dep} – ${ret}`;
    }
  };

  const formatSingleDate = (dStr?: string) => {
    if (!dStr) return '-';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-10">
      
      {/* 1. Boarding Pass Card Container */}
      <div className="ticket-container overflow-hidden">
        
        {/* Ticket Header (Club Pass Style) */}
        <div className="bg-[#121113] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4E38FF] flex items-center justify-center text-white shadow-sm">
              <AirplaneTilt size={24} weight="bold" />
            </div>
            <div>
              <span className="text-xs font-mono text-white/70 uppercase block mb-1">
                {batchCode}
              </span>
              <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                {batchTitle || seriesName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#D4FF00]">
            <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
            <span>{remainingSeats} dari {capacity} Seat Tersedia</span>
          </div>
        </div>

        {/* Flight & Travel Route Specs */}
        <div className="p-6 sm:p-8 bg-[#FAF8F5] border-b border-black/5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Rute Perjalanan
              </span>
              <span className="font-display font-extrabold text-base sm:text-lg text-[#121113] mt-0.5 block">
                {routeInfo.route}
              </span>
              <span className="text-xs text-[#64748B]">{routeInfo.via}</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Tanggal Keberangkatan
              </span>
              <span className="font-display font-extrabold text-base sm:text-lg text-[#121113] mt-0.5 block">
                {formatDateRange(departureDate, returnDate)}
              </span>
              <span className="text-xs text-[#FD562A] font-bold">Confirmed Schedule</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Circle Kapasitas
              </span>
              <span className="font-display font-extrabold text-base sm:text-lg text-[#121113] mt-0.5 block">
                Max {capacity} Pax
              </span>
              <span className="text-xs text-[#4E38FF] font-bold">100% Solo Friendly</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Batas Pelunasan
              </span>
              <span className="font-display font-extrabold text-base sm:text-lg text-[#121113] mt-0.5 block">
                {formatSingleDate(h30Date)}
              </span>
              <span className="text-xs text-[#64748B]">Tepat H-30 Berangkat</span>
            </div>
          </div>
        </div>

        {/* Perforated Divider */}
        <div className="ticket-perforated">
          <div className="ticket-notch-left" />
          <div className="ticket-notch-right" />
        </div>

        {/* Package & Headcount Controls */}
        <div className="p-6 sm:p-8 space-y-8 bg-white">
          
          {/* Step 1: Package Selector Tabs */}
          <div className="space-y-3">
            <label className="font-display text-xs font-bold uppercase tracking-widest text-[#64748B] block">
              1. Pilih Opsi Paket Perjalanan
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Package */}
              <button
                type="button"
                onClick={() => setPackageType('full')}
                className={`p-5 rounded-2xl text-left border-2 transition-all relative ${
                  packageType === 'full'
                    ? 'border-[#FD562A] bg-[#FD562A]/5 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                {packageType === 'full' && (
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#FD562A] text-white text-[10px] font-black uppercase">
                    LIMITED PROMO
                  </span>
                )}
                <span className="font-display font-bold text-base text-[#121113] block">
                  Full Package (All-In)
                </span>
                <span className="text-xs text-[#64748B] mt-1 block">
                  Tiket Pesawat PP + Hotel Twin/Double Sharing + Transportasi Privat + Tiket Wisata + Makan + Dokumentasi.
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display font-black text-2xl text-[#FD562A]">
                    {formatIDR(fullPackagePrice)}
                  </span>
                  <span className="text-xs text-neutral-400 promo-strike">
                    {formatIDR(fullPackageNormalPrice)}
                  </span>
                </div>
              </button>

              {/* Land Tour Only */}
              <button
                type="button"
                onClick={() => setPackageType('land')}
                className={`p-5 rounded-2xl text-left border-2 transition-all relative ${
                  packageType === 'land'
                    ? 'border-[#FD562A] bg-[#FD562A]/5 shadow-sm'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <span className="font-display font-bold text-base text-[#121113] block">
                  Land Tour Only
                </span>
                <span className="text-xs text-[#64748B] mt-1 block">
                  Tanpa tiket pesawat internasional. Meeting point langsung di bandara / stasiun kota tujuan.
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display font-black text-2xl text-[#121113]">
                    {formatIDR(landTourPrice)}
                  </span>
                  <span className="text-xs text-neutral-400 promo-strike">
                    {formatIDR(landTourNormalPrice)}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Headcount Stepper */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-display text-xs font-bold uppercase tracking-widest text-[#64748B]">
                2. Jumlah Peserta / Traveler
              </label>
              <span className="text-xs text-[#FD562A] font-bold">
                Tersedia {remainingSeats} slot
              </span>
            </div>

            <div className="flex items-center gap-4 bg-[#FAF8F5] p-3 rounded-2xl border border-black/5 w-fit">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={headcount <= 1}
                className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-[#121113] hover:bg-neutral-100 disabled:opacity-40 shadow-xs active:scale-95 transition-all"
                aria-label="Kurangi traveler"
              >
                <Minus size={18} weight="bold" />
              </button>

              <div className="min-w-[80px] text-center">
                <span className="font-display font-black text-2xl text-[#121113]">
                  {headcount}
                </span>
                <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                  Pax
                </span>
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                disabled={headcount >= remainingSeats}
                className="w-10 h-10 rounded-xl bg-white border border-black/10 flex items-center justify-center text-[#121113] hover:bg-neutral-100 disabled:opacity-40 shadow-xs active:scale-95 transition-all"
                aria-label="Tambah traveler"
              >
                <Plus size={18} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. THE AUTHENTIC INSTALLMENT SCHEME CARD
      ========================================================================== */}
      <div className="relative rounded-[2.5rem] bg-[#FD562A] text-white p-6 sm:p-10 lg:p-12 border-4 border-white shadow-2xl overflow-hidden space-y-8">
        
        {/* Top-Left Mascot */}
        <div className="absolute -top-4 -left-4 z-20 pointer-events-none">
          <SmileySunglassesSticker size={72} glassesColor="#121113" className="-rotate-12" />
        </div>

        {/* Bottom-Right Mascot */}
        <div className="absolute -bottom-5 -right-5 z-20 pointer-events-none">
          <ThumbsUpSticker size={84} className="rotate-12" />
        </div>

        {/* Card Title */}
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h3 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
            Installment Scheme
          </h3>
          <p className="text-xs sm:text-sm text-white/90 font-medium">
            Kalkulasi resmi cicilan bulanan sd H-30 untuk {headcount} Pax ({packageType === 'full' ? 'Full Package' : 'Land Tour Only'})
          </p>
        </div>

        {/* Grid Layout for Months */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-center">
          
          {/* Booking Seat DP */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25">
            <span className="text-[11px] font-bold uppercase text-white/80 block">
              Booking Seat (DP)
            </span>
            <span className="font-display font-black text-base sm:text-lg text-white mt-1 block">
              {formatIDR(simulation.total_dp_idr)}
            </span>
            <span className="text-[10px] text-white/70">Wajib di awal</span>
          </div>

          {/* Month Slots */}
          {simulation.schedule.map((item, idx) => (
            <div key={idx} className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/25">
              <span className="text-[11px] font-bold uppercase text-white/80 block">
                {item.month_name.split(' ')[0]}
              </span>
              <span className="font-display font-black text-base sm:text-lg text-white mt-1 block">
                {formatIDR(item.amount_idr)}
              </span>
              <span className="text-[10px] text-white/70">
                ({formatIDR(item.amount_idr / headcount)}/pax)
              </span>
            </div>
          ))}

          {/* Total Cost Box */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-6 bg-white rounded-2xl p-5 text-[#121113] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                Total Biaya Perjalanan ({headcount} Pax)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-black text-2xl sm:text-3xl text-[#FD562A]">
                  {formatIDR(simulation.total_price_idr)}
                </span>
                <span className="text-xs text-neutral-400 promo-strike">
                  {formatIDR(currentNormalPrice * headcount)}
                </span>
              </div>
            </div>

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#FD562A] hover:bg-[#121113] text-white font-display font-bold text-sm tracking-wide shadow-md transition-all active:scale-95"
            >
              <WhatsappLogo size={20} weight="fill" />
              <span>Amankan Slot via WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Subtext */}
        <div className="text-center pt-2">
          <p className="text-xs text-white/80 font-medium">
            Konfirmasi ketersediaan slot langsung terhubung ke WhatsApp: <strong className="text-white">+62 857-7499-9875</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
