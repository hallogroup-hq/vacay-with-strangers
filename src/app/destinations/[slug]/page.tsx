import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';
import { query } from '@/lib/db';
import { getPublicBatches } from '@/lib/db/queries';
import { formatIDR } from '@/lib/whatsapp/generator';
import { CalendarBlank, MapPin, ArrowRight } from '@phosphor-icons/react/dist/ssr';

interface DestinationPageProps {
  params: Promise<{
    slug: string;
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

export const dynamic = 'force-dynamic';

export default async function DestinationPage(props: DestinationPageProps) {
  const params = await props.params;
  const { slug } = params;

  const destRes = await query(`SELECT * FROM destinations WHERE slug = $1 AND is_active = true`, [slug]);
  if (destRes.rowCount === 0) {
    notFound();
  }
  const dest = destRes.rows[0];

  const batches = await getPublicBatches({ countryCode: dest.country_code });

  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-white">
        <section className="bg-[#1F1E1F] text-white py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
              Destinasi Perjalanan
            </span>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {dest.name}
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
              {dest.summary || `Jelajahi open-trip resmi Vacay With Strangers ke ${dest.name}.`}
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="font-display text-2xl font-bold text-[#1F1E1F]">
                Batch Tersedia untuk {dest.name}
              </h2>
            </div>

            {batches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {batches.map((batch) => (
                  <div
                    key={batch.batch_id}
                    className="flex flex-col rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-400 transition-all bg-white shadow-sm"
                  >
                    <div className="relative h-56 w-full bg-neutral-100">
                      <Image
                        src="/images/autumn-hero.jpg"
                        alt={batch.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/95 text-neutral-900 border border-gray-200">
                          {batch.batch_code}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                          <CalendarBlank size={16} />
                          <span>{formatDateRange(batch.departure_date, batch.return_date)}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-[#1F1E1F]">
                          {batch.title}
                        </h3>
                        <p className="text-xs text-neutral-600 line-clamp-2">
                          {batch.route_summary || batch.lead}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-neutral-500 block">Mulai Dari</span>
                          <span className="font-display font-bold text-base text-[#1F1E1F]">
                            {batch.price_from ? formatIDR(batch.price_from) : 'Rp 21.000.000'}
                          </span>
                        </div>

                        <Link
                          href={`/trips/${batch.series_slug}/${batch.batch_slug}`}
                          className="px-4 py-2 rounded-full bg-[#1F1E1F] text-white text-xs font-semibold hover:bg-[#5335FF] transition-colors"
                        >
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl text-neutral-500 text-sm">
                Belum ada batch aktif yang dibuka untuk destinasi ini.
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
