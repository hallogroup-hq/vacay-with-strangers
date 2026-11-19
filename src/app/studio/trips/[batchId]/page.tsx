import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import BatchEditorForm from '@/components/studio/BatchEditorForm';
import { ArrowLeft, Compass, CalendarBlank, MapPin, Sparkle, Tag, Clock } from '@phosphor-icons/react/dist/ssr';

interface BatchPageProps {
  params: Promise<{ batchId: string }>;
}

export const revalidate = 0;

export default async function StudioBatchPage(props: BatchPageProps) {
  const session = await getAdminSession();
  if (!session) redirect('/studio/login');

  const { batchId } = await props.params;

  const sql = `
    SELECT 
      b.*,
      ts.name AS series_name,
      ts.slug AS series_slug,
      d.name AS destination_name,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status,
      v.id AS current_version_id,
      v.revision_no,
      v.status AS version_status,
      v.title,
      v.lead,
      v.route_summary,
      v.departure_meeting_info
    FROM batches b
    JOIN trip_series ts ON b.trip_series_id = ts.id
    JOIN destinations d ON ts.destination_id = d.id
    JOIN v_batch_seat_status bss ON bss.batch_id = b.id
    LEFT JOIN batch_content_versions v 
      ON v.batch_id = b.id 
      ORDER BY v.revision_no DESC 
      LIMIT 1
  `;
  const res = await query(sql, [batchId]);
  if (res.rowCount === 0) notFound();

  const batch = res.rows[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="p-2 rounded-lg border border-gray-300 text-neutral-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-2xl text-[#1F1E1F]">
                {batch.batch_code}
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                {batch.effective_status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {batch.series_name} ({batch.destination_name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/trips/${batch.series_slug}/${batch.slug}`}
            target="_blank"
            className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-semibold transition-colors text-neutral-700"
          >
            Lihat Halaman Publik
          </Link>
          <Link
            href={`/studio/trips/${batch.id}/duplicate`}
            className="px-4 py-2 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors"
          >
            Duplikasi Batch
          </Link>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs sm:text-sm font-semibold">
        <Link
          href={`/studio/trips/${batch.id}`}
          className="pb-3 text-[#1F1E1F] border-b-2 border-[#1F1E1F]"
        >
          Pengaturan & Publikasi
        </Link>
        <Link
          href={`/studio/trips/${batch.id}/itinerary`}
          className="pb-3 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          Itinerary Hari demi Hari
        </Link>
        <Link
          href={`/studio/trips/${batch.id}/pricing`}
          className="pb-3 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          Paket & Harga
        </Link>
      </div>

      {/* Client Editor Form */}
      <BatchEditorForm batch={batch} />
    </div>
  );
}
