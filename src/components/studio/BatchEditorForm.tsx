'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BatchEditorForm({ batch }: { batch: any }) {
  const router = useRouter();

  const [batchCode, setBatchCode] = useState(batch.batch_code || '');
  const [departureDate, setDepartureDate] = useState(batch.departure_date || '');
  const [returnDate, setReturnDate] = useState(batch.return_date || '');
  const [capacity, setCapacity] = useState(batch.capacity || 12);
  const [bookingState, setBookingState] = useState(batch.booking_state || 'coming_soon');
  const [showExactSeats, setShowExactSeats] = useState(Boolean(batch.show_exact_seats));

  const [title, setTitle] = useState(batch.title || '');
  const [lead, setLead] = useState(batch.lead || '');
  const [routeSummary, setRouteSummary] = useState(batch.route_summary || '');
  const [departureMeetingInfo, setDepartureMeetingInfo] = useState(batch.departure_meeting_info || '');

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/studio/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchCode,
          departureDate,
          returnDate,
          capacity,
          bookingState,
          showExactSeats,
          title,
          lead,
          routeSummary,
          departureMeetingInfo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan');

      setMessage({ text: 'Perubahan berhasil disimpan.' });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menyimpan', isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!batch.current_version_id) {
      alert('Tidak ada versi draf untuk dipublikasikan.');
      return;
    }

    if (!confirm('Publikasikan revisi konten ini ke website publik sekarang?')) return;

    setPublishing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/studio/batches/${batch.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: batch.current_version_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mempublikasikan');

      setMessage({ text: data.message || 'Revisi berhasil dipublikasikan.' });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal mempublikasikan', isError: true });
    } finally {
      setPublishing(false);
    }
  };

  const isPublished = batch.published_version_id === batch.current_version_id;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold ${
            message.isError
              ? 'bg-neutral-100 border border-neutral-300 text-neutral-800'
              : 'bg-neutral-100 border border-neutral-300 text-neutral-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Revision Status & Publish Action Bar */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
            Status Publikasi Konten
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-display font-bold text-lg text-neutral-900">
              Revisi {batch.revision_no || 1}
            </span>
            {isPublished ? (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
                LIVE DI PUBLIK
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-neutral-100 text-neutral-700">
                DRAF (BELUM LIVE)
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            {isPublished
              ? 'Konten ini sedang aktif dilihat pengunjung website.'
              : 'Perubahan masih tersimpan sebagai draf dan belum terlihat oleh pengunjung.'}
          </p>
        </div>

        {!isPublished && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="px-5 py-2.5 rounded-xl bg-[#5335FF] text-white hover:bg-[#685BC6] text-xs font-bold transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {publishing ? 'Mempublikasikan...' : 'Publikasikan Revisi Ini'}
          </button>
        )}
      </div>

      {/* Operational Settings Grid */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <h3 className="font-display font-bold text-base text-neutral-900">
          Parameter Operasional Batch
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Kode Batch
            </label>
            <input
              type="text"
              required
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Status Pendaftaran
            </label>
            <select
              value={bookingState}
              onChange={(e) => setBookingState(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
            >
              <option value="coming_soon">Coming Soon</option>
              <option value="open">Open (Pendaftaran Dibuka)</option>
              <option value="closed">Closed (Ditutup)</option>
              <option value="completed">Completed (Selesai)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Kapasitas Maksimal (Seat)
            </label>
            <input
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Tanggal Berangkat
            </label>
            <input
              type="date"
              required
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Tanggal Kepulangan
            </label>
            <input
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              id="showExactSeats"
              type="checkbox"
              checked={showExactSeats}
              onChange={(e) => setShowExactSeats(e.target.checked)}
              className="w-4 h-4 rounded text-[#1F1E1F]"
            />
            <label htmlFor="showExactSeats" className="text-xs font-semibold text-neutral-700 cursor-pointer">
              Tampilkan sisa seat numerik ke publik
            </label>
          </div>
        </div>
      </div>

      {/* Editorial Content Grid */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
        <h3 className="font-display font-bold text-base text-neutral-900">
          Konten Tampilan Halaman Detail
        </h3>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Judul Tampilan Trip
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Deskripsi / Lead Singkat
          </label>
          <textarea
            rows={3}
            value={lead}
            onChange={(e) => setLead(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Rangkuman Rute Kota
          </label>
          <input
            type="text"
            value={routeSummary}
            onChange={(e) => setRouteSummary(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Informasi Titik Kumpul (Meeting Point Keberangkatan)
          </label>
          <input
            type="text"
            value={departureMeetingInfo}
            onChange={(e) => setDepartureMeetingInfo(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
