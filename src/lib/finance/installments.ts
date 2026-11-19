import { InstallmentSimulationResult, InstallmentSimulationMonth } from '../types';

/**
 * Calculates H-30 deadline: exactly 30 calendar days before departure date.
 * Returns ISO date string (YYYY-MM-DD).
 */
export function calculateH30Date(departureDateStr: string): string {
  const parts = departureDateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // 0-indexed
  const day = parseInt(parts[2], 10);

  const depDate = new Date(Date.UTC(year, month, day));
  depDate.setUTCDate(depDate.getUTCDate() - 30);

  const y = depDate.getUTCFullYear();
  const m = String(depDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(depDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calculates available monthly payment slots between referenceDate and H-30 date.
 */
export function getAvailableMonthlySlots(referenceDate: Date, h30DateStr: string): string[] {
  const h30Parts = h30DateStr.split('-');
  const hYear = parseInt(h30Parts[0], 10);
  const hMonth = parseInt(h30Parts[1], 10); // 1-12

  const startYear = referenceDate.getUTCFullYear();
  const startMonth = referenceDate.getUTCMonth() + 1; // 1-12

  const slots: string[] = [];
  let currY = startYear;
  let currM = startMonth;

  while (currY < hYear || (currY === hYear && currM <= hMonth)) {
    const formatted = `${currY}-${String(currM).padStart(2, '0')}-01`;
    slots.push(formatted);
    currM++;
    if (currM > 12) {
      currM = 1;
      currY++;
    }
  }

  return slots;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatMonthNameID(dateStr: string): string {
  const parts = dateStr.split('-');
  const monthIdx = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  return `${MONTH_NAMES_ID[monthIdx]} ${year}`;
}

/**
 * Pure installment calculation engine.
 * Ensures integer IDR math and remainder balancing on the final installment.
 */
export function calculateInstallmentSchedule(params: {
  departureDate: string;
  effectivePriceIdr: number;
  dpPerTravelerIdr: number;
  headcount: number;
  now?: Date;
  customMonths?: number;
  customDpPerTravelerIdr?: number;
  isOfficial?: boolean;
}): InstallmentSimulationResult {
  const {
    departureDate,
    effectivePriceIdr,
    dpPerTravelerIdr,
    headcount,
    now = new Date(),
    customMonths,
    customDpPerTravelerIdr,
    isOfficial = true,
  } = params;

  const h30Date = calculateH30Date(departureDate);
  const nowIso = now.toISOString().split('T')[0];

  const effectiveDpPerTraveler =
    customDpPerTravelerIdr !== undefined && customDpPerTravelerIdr >= dpPerTravelerIdr
      ? customDpPerTravelerIdr
      : dpPerTravelerIdr;

  const totalPriceIdr = effectivePriceIdr * headcount;
  const totalDpIdr = effectiveDpPerTraveler * headcount;
  const remainingBalanceIdr = Math.max(0, totalPriceIdr - totalDpIdr);

  // If current date is on or past H-30, no monthly installment schedule is offered
  if (nowIso >= h30Date) {
    return {
      is_eligible: false,
      reason: 'Batas waktu cicilan resmi (H-30 keberangkatan) telah terlampaui. Pembayaran penuh atau persetujuan khusus dapat dikonfirmasi via WhatsApp.',
      h30_date: h30Date,
      departure_date: departureDate,
      price_per_traveler_idr: effectivePriceIdr,
      headcount,
      total_price_idr: totalPriceIdr,
      dp_per_traveler_idr: effectiveDpPerTraveler,
      total_dp_idr: totalDpIdr,
      remaining_balance_idr: remainingBalanceIdr,
      tenor_months: 0,
      monthly_amount_idr: 0,
      schedule: [],
      is_official: false,
    };
  }

  const availableSlots = getAvailableMonthlySlots(now, h30Date);
  if (availableSlots.length === 0) {
    return {
      is_eligible: false,
      reason: 'Tidak ada periode bulan tersisa sebelum batas H-30.',
      h30_date: h30Date,
      departure_date: departureDate,
      price_per_traveler_idr: effectivePriceIdr,
      headcount,
      total_price_idr: totalPriceIdr,
      dp_per_traveler_idr: effectiveDpPerTraveler,
      total_dp_idr: totalDpIdr,
      remaining_balance_idr: remainingBalanceIdr,
      tenor_months: 0,
      monthly_amount_idr: 0,
      schedule: [],
      is_official: false,
    };
  }

  let tenor = availableSlots.length;
  if (customMonths !== undefined && customMonths > 0) {
    tenor = Math.min(customMonths, availableSlots.length);
  }

  const selectedSlots = availableSlots.slice(0, tenor);
  const baseMonthly = Math.floor(remainingBalanceIdr / tenor);
  const remainder = remainingBalanceIdr - baseMonthly * tenor;

  const schedule: InstallmentSimulationMonth[] = selectedSlots.map((slot, index) => {
    const isLast = index === selectedSlots.length - 1;
    const amount = isLast ? baseMonthly + remainder : baseMonthly;
    return {
      month_date: slot,
      month_name: formatMonthNameID(slot),
      amount_idr: amount,
    };
  });

  return {
    is_eligible: true,
    h30_date: h30Date,
    departure_date: departureDate,
    price_per_traveler_idr: effectivePriceIdr,
    headcount,
    total_price_idr: totalPriceIdr,
    dp_per_traveler_idr: effectiveDpPerTraveler,
    total_dp_idr: totalDpIdr,
    remaining_balance_idr: remainingBalanceIdr,
    tenor_months: tenor,
    monthly_amount_idr: baseMonthly,
    schedule,
    is_official: isOfficial && !customMonths && !customDpPerTravelerIdr,
  };
}
