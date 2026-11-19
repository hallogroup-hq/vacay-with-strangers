'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check } from '@phosphor-icons/react';

export default function CreateBatchPage() {
  const router = useRouter();
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [tripSeriesId, setTripSeriesId] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [capacity, setCapacity] = useState(12);
  const [bookingState, setBookingState] = useState('coming_soon');
  const [title, setTitle] = useState('');
  const [lead, setLead] = useState('');
  const [routeSummary, setRouteSummary] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch series list
    fetch('/api/studio/batches')
      .then(() => {
        // Query series directly via a quick helper or fetch
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/studio/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripSeriesId,
          batchCode,
          departureDate,
          returnDate,
          capacity,
          bookingState,
          title,
          lead,
          routeSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat batch');

      router.push(`/studio/trips/${data.batchId}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/studio"
          className="p-2 rounded-lg border border-gray-300 text-neutral-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-[#1F1E1F]">
            Buat Batch Keberangkatan Baru
          </h1>
          <p className="text-xs text-neutral-500">
            Tambahkan jadwal keberangkatan baru di bawah seri trip yang ada.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="tripSeriesId" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Trip Series ID
            </label>
            <input
              id="tripSeriesId"
              type="text"
              required
              value={tripSeriesId}
              onChange={(e) => setTripSeriesId(e.target.value)}
              placeholder="UUID Series (misal: seri Japan Autumn)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
            <span className="text-[11px] text-neutral-400 mt-1 block">
              Gunakan ID series terdaftar atau duplikasi dari batch yang sudah ada.
            </span>
          </div>

          <div>
            <label htmlFor="batchCode" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Kode Batch
            </label>
            <input
              id="batchCode"
              type="text"
              required
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              placeholder="Contoh: Batch 02"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="departureDate" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Tanggal Berangkat
            </label>
            <input
              id="departureDate"
              type="date"
              required
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="returnDate" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Tanggal Kepulangan
            </label>
            <input
              id="returnDate"
              type="date"
              required
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="capacity" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Kapasitas Maksimal Kursi (Capacity)
            </label>
            <input
              id="capacity"
              type="number"
              min={1}
              max={50}
              required
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="bookingState" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Status Pendaftaran
            </label>
            <select
              id="bookingState"
              value={bookingState}
              onChange={(e) => setBookingState(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            >
              <option value="coming_soon">Coming Soon</option>
              <option value="open">Open (Pendaftaran Dibuka)</option>
              <option value="closed">Closed (Ditutup)</option>
              <option value="completed">Completed (Selesai)</option>
              <option value="cancelled">Cancelled (Dibatalkan)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Judul Tampilan Trip
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Japan Countryside Autumn Trip"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="lead" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Ringkasan / Lead Text
            </label>
            <textarea
              id="lead"
              rows={3}
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              placeholder="Jelaskan daya tarik utama batch perjalanan ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="routeSummary" className="block text-xs font-bold text-neutral-700 mb-1.5">
              Ringkasan Rute Kota
            </label>
            <input
              id="routeSummary"
              type="text"
              value={routeSummary}
              onChange={(e) => setRouteSummary(e.target.value)}
              placeholder="Contoh: Osaka · Nagoya · Gifu · Nagano · Tokyo"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:border-[#5335FF] bg-white text-neutral-900"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            href="/studio"
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#1F1E1F] text-white text-xs font-semibold hover:bg-[#5335FF] transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Buat Batch'}
          </button>
        </div>
      </form>
    </div>
  );
}
