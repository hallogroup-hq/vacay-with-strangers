import Link from 'next/link';
import Image from 'next/image';
import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';
import { getPublicBatches, getPublicDestinations } from '@/lib/db/queries';
import { formatIDR } from '@/lib/whatsapp/generator';
import { CalendarBlank, MapPin, ArrowRight, Funnel, Users, Sparkle } from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

interface TripsPageProps {
  searchParams: Promise<{
    country?: string;
    season?: string;
    month?: string;
    status?: string;
  }>;
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

export const revalidate = 30;

export default async function TripsPage(props: TripsPageProps) {
  const searchParams = await props.searchParams;
  const country = searchParams.country;
  const season = searchParams.season;
  const month = searchParams.month;
  const status = searchParams.status;

  const [batches, destinations] = await Promise.all([
    getPublicBatches({
      countryCode: country,
      season,
      month,
      status,
    }),
    getPublicDestinations(),
  ]);

  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-[#FAF8F5]">
        {/* Page Header */}
        <section className="bg-white border-b border-black/5 py-14 lg:py-18">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4E38FF]">
                Direktori Perjalanan
              </div>

              <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight">
                Jelajah Jadwal Perjalanan
              </h1>

              <p className="font-body text-base text-[#64748B]">
                Temukan batch open-trip curated dengan circle kecil (maksimal 10–12 pax). Seluruh batch didampingi tour leader berpengalaman dan skema cicilan transparan.
              </p>
            </div>
          </div>
        </section>

        {/* Content & Filters */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs">
              <form method="GET" action="/trips" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Country Filter */}
                <div>
                  <label htmlFor="country" className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                    Negara Tujuan
                  </label>
                  <select
                    id="country"
                    name="country"
                    defaultValue={country || ''}
                    className="w-full text-xs sm:text-sm font-medium border border-black/10 rounded-xl px-3.5 py-2.5 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                  >
                    <option value="">Semua Negara</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.country_code}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Season Filter */}
                <div>
                  <label htmlFor="season" className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                    Musim (Season)
                  </label>
                  <select
                    id="season"
                    name="season"
                    defaultValue={season || ''}
                    className="w-full text-xs sm:text-sm font-medium border border-black/10 rounded-xl px-3.5 py-2.5 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                  >
                    <option value="">Semua Musim</option>
                    <option value="autumn">Autumn (Musim Gugur)</option>
                    <option value="winter">Winter (Musim Salju)</option>
                    <option value="spring">Spring (Musim Semi)</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                    Status Kuota
                  </label>
                  <select
                    id="status"
                    name="status"
                    defaultValue={status || ''}
                    className="w-full text-xs sm:text-sm font-medium border border-black/10 rounded-xl px-3.5 py-2.5 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                  >
                    <option value="">Semua Status</option>
                    <option value="open">Open (Bisa Dibooking)</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="closed">Closed / Selesai</option>
                  </select>
                </div>

                {/* Submit & Reset */}
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#121113] text-white hover:bg-[#4E38FF] text-xs font-bold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Funnel size={14} weight="bold" />
                    <span>Filter</span>
                  </button>

                  <Link
                    href="/trips"
                    className="py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-neutral-200 text-[#121113] text-xs font-bold transition-all text-center"
                  >
                    Reset
                  </Link>
                </div>
              </form>
            </div>

            {/* Batches Grid */}
            {batches.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-black/5 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FAF8F5] flex items-center justify-center mx-auto text-[#64748B]">
                  <MapPin size={32} weight="bold" />
                </div>
                <h3 className="font-display font-bold text-xl text-[#121113]">
                  Tidak ada batch yang cocok dengan filter
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                  Coba ubah kriteria filter negaramu atau hubungi admin di WhatsApp untuk jadwal trip mendatang.
                </p>
                <Link
                  href="/trips"
                  className="inline-block px-6 py-2.5 rounded-full bg-[#4E38FF] text-white text-xs font-bold"
                >
                  Tampilkan Semua Batch
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {batches.map((batch) => {
                  const isComingSoon = batch.effective_status === 'coming_soon';
                  const isFull = batch.effective_status === 'fully_booked' || batch.remaining_seats <= 0;
                  const heroImg = batch.series_slug === 'japan-winter'
                    ? '/images/winter-hero.jpg'
                    : batch.country_code === 'CN'
                    ? '/images/destinations/china.jpg'
                    : batch.country_code === 'VN'
                    ? '/images/destinations/vietnam.jpg'
                    : batch.country_code === 'KZ'
                    ? '/images/destinations/kazakhstan.jpg'
                    : batch.hero_image_url || '/images/autumn-hero.jpg';

                  return (
                    <div
                      key={batch.batch_id}
                      className="bg-white rounded-3xl overflow-hidden border border-black/5 hover:border-black/10 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Header */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                          <Image
                            src={heroImg}
                            alt={batch.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-xs font-bold">
                            {batch.destination_name}
                          </div>
                          {isComingSoon ? (
                            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono uppercase tracking-wider">
                              Coming Soon
                            </div>
                          ) : isFull ? (
                            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-neutral-900 text-white text-[10px] font-mono uppercase tracking-wider">
                              Fully Booked
                            </div>
                          ) : (
                            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white text-[#121113] text-[10px] font-mono font-bold uppercase shadow-xs">
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

                          <h3 className="font-display font-bold text-xl text-[#121113] group-hover:text-[#4E38FF] transition-colors leading-snug">
                            {batch.title}
                          </h3>

                          <p className="font-body text-xs text-[#64748B] line-clamp-2">
                            {batch.tagline || 'Eksplorasi autentik bersama circle kecil yang menyenangkan.'}
                          </p>

                          <div className="pt-2 flex items-center gap-3 text-xs text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <Users size={14} weight="bold" />
                              <span>Max {batch.capacity} pax</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 pb-6 pt-2 border-t border-black/5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">
                            Investasi Mulai
                          </span>
                          <span className="font-display font-extrabold text-base text-[#121113]">
                            {formatIDR(batch.price_from || batch.starting_price_idr || 21000000)}
                          </span>
                        </div>

                        <Link
                          href={`/trips/${batch.series_slug}/${batch.batch_slug}`}
                          className="px-5 py-2.5 rounded-full bg-[#121113] hover:bg-[#4E38FF] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          <span>Pilih Batch</span>
                          <ArrowRight size={14} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
