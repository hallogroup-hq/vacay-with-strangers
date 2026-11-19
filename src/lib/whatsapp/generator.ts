export interface WhatsAppMessageParams {
  seriesName: string;
  batchCode: string;
  dateRange: string;
  packageName: string;
  headcount: number;
  isCustomInstallment?: boolean;
  installmentTenorMonths?: number;
  monthlyAmountIdr?: number;
}

export const OFFICIAL_WA_NUMBER = '6285774999875';

export function formatIDR(amount: number | string | bigint | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Rp 0';
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

export function generateWhatsAppMessage(params: WhatsAppMessageParams): string {
  const {
    seriesName,
    batchCode,
    dateRange,
    packageName,
    headcount,
    isCustomInstallment,
    installmentTenorMonths,
    monthlyAmountIdr,
  } = params;

  let installmentContext = 'skema cicilan resmi';
  if (isCustomInstallment && installmentTenorMonths && monthlyAmountIdr) {
    installmentContext = `simulasi cicilan custom (belum disetujui: ${installmentTenorMonths} bulan @ ${formatIDR(monthlyAmountIdr)}/bln)`;
  }

  const travelerText = headcount === 1 ? '1 peserta' : `${headcount} peserta`;

  return (
    `Halo Vacay With Strangers! Aku tertarik ${seriesName} — ${batchCode} (${dateRange}). ` +
    `Paket: ${packageName}, ${travelerText}. ` +
    `Aku mau tanya ketersediaan seat dan ${installmentContext}. Terima kasih!`
  );
}

export function generateWhatsAppUrl(params: WhatsAppMessageParams): string {
  const message = generateWhatsAppMessage(params);
  return `https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent(message)}`;
}
