'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy } from '@phosphor-icons/react';

export default function DuplicateBatchPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const [newBatchCode, setNewBatchCode] = useState('');
  const [newDepartureDate, setNewDepartureDate] = useState('');
  const [newReturnDate, setNewReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/studio/batches/${batchId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newBatchCode,
          newDepartureDate,
          newReturnDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menduplikasi batch');

      router.push(`/studio/trips/${data.newBatchId}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/studio/trips/${batchId}`}
          className="p-2 rounded-lg border border-gray-300 text-neutral-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-[#1F1E1F]">
            Duplikasi Konfigurasi Batch
          </h1>
          <p className="text-xs text-neutral-500">
            Salin seluruh susunan itinerary hari, aktivitas, opsi paket harga, dan ketentuan ke batch baru.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs">
        <strong>Pemberitahuan Sistem:</strong> Sesuai PRD DEC-14, duplikasi batch HANYA menyalin konfigurasi konten & penawaran sebagai draf baru. Sistem tidak pernah menyalin data pemesanan, peserta, pembayaran, atau alokasi kursi historis.
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleDuplicate} className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Kode Batch Baru
          </label>
          <input
            type="text"
            required
            value={newBatchCode}
            onChange={(e) => setNewBatchCode(e.target.value)}
            placeholder="Contoh: Batch 02"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Tanggal Berangkat Baru
          </label>
          <input
            type="date"
            required
            value={newDepartureDate}
            onChange={(e) => setNewDepartureDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 mb-1.5">
            Tanggal Kepulangan Baru
          </label>
          <input
            type="date"
            required
            value={newReturnDate}
            onChange={(e) => setNewReturnDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          />
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <Link
            href={`/studio/trips/${batchId}`}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#1F1E1F] text-white text-xs font-semibold hover:bg-[#5335FF] transition-colors disabled:opacity-50"
          >
            {loading ? 'Menduplikasi...' : 'Duplikasi Sekarang'}
          </button>
        </div>
      </form>
    </div>
  );
}
