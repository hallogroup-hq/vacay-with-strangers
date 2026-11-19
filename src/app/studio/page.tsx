import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/session';
import { query } from '@/lib/db';
import { Plus, Copy, PencilSimple, ArrowRight, Compass } from '@phosphor-icons/react/dist/ssr';

export const revalidate = 0; // Dynamic admin data

export default async function StudioOverviewPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/studio/login');
  }

  // Fetch batches joined with series, destination, and seat allocation count
  const sql = `
    SELECT 
      b.id AS batch_id,
      b.batch_code,
      b.slug AS batch_slug,
      b.departure_date,
      b.return_date,
      b.capacity,
      b.booking_state,
      b.published_version_id,
      ts.name AS series_name,
      ts.slug AS series_slug,
      d.name AS destination_name,
      bss.allocated_seats,
      bss.remaining_seats,
      bss.effective_status,
      v.revision_no AS published_revision_no
    FROM batches b
    JOIN trip_series ts ON b.trip_series_id = ts.id
    JOIN destinations d ON ts.destination_id = d.id
    JOIN v_batch_seat_status bss ON bss.batch_id = b.id
    LEFT JOIN batch_content_versions v ON b.published_version_id = v.id
    ORDER BY b.departure_date DESC
  `;
  const res = await query(sql);
  const batches = res.rows;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1E1F]">
            Manajemen Trip & Batch
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Kelola jadwal keberangkatan, itinerary, harga, alokasi kuota, dan status publikasi.
          </p>
        </div>

        <Link
          href="/studio/trips/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] font-semibold text-xs sm:text-sm transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} weight="bold" />
          <span>Buat Batch Baru</span>
        </Link>
      </div>

      {/* Batches Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            Daftar Batch Keberangkatan ({batches.length})
          </h2>
        </div>

        {batches.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-neutral-800">
              <thead className="bg-[#F8F9FA] text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-6">Batch & Destinasi</th>
                  <th className="py-3 px-6">Tanggal</th>
                  <th className="py-3 px-6">Status Booking</th>
                  <th className="py-3 px-6">Alokasi Seat</th>
                  <th className="py-3 px-6">Publikasi</th>
                  <th className="py-3 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {batches.map((batch) => (
                  <tr key={batch.batch_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-neutral-900 text-sm">
                        {batch.batch_code}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {batch.series_name} ({batch.destination_name})
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-xs text-neutral-700">
                      {batch.departure_date} s/d {batch.return_date}
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                        {batch.effective_status.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-neutral-900">
                        {batch.allocated_seats} / {batch.capacity}
                      </span>
                      <span className="text-neutral-500 text-xs block">
                        (Sisa {batch.remaining_seats} seat)
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      {batch.published_version_id ? (
                        <span className="text-xs font-semibold text-neutral-800">
                          Rev {batch.published_revision_no} (Live)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-neutral-400">
                          Draft / Belum Rilis
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/studio/trips/${batch.batch_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold transition-colors"
                        >
                          <PencilSimple size={14} />
                          <span>Kelola</span>
                        </Link>

                        <Link
                          href={`/studio/trips/${batch.batch_id}/duplicate`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold transition-colors"
                          title="Duplikasi konfigurasi batch"
                        >
                          <Copy size={14} />
                          <span>Duplikasi</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-neutral-500 text-sm">
            Belum ada batch yang terdaftar. Tekan &ldquo;Buat Batch Baru&rdquo; untuk memulai.
          </div>
        )}
      </div>
    </div>
  );
}
