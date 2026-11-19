'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash, UserPlus, CheckCircle } from '@phosphor-icons/react';

interface BatchOption {
  id: string;
  batch_code: string;
  series_name: string;
  destination_name: string;
  departure_date: string;
  remaining_seats: number;
}

interface OfferOption {
  offer_id: string;
  batch_id: string;
  display_name: string;
  package_type: string;
  room_type: string;
  effective_price_idr: number;
  dp_per_traveler_idr: number;
}

interface TravelerInput {
  fullName: string;
  contactPhone: string;
  priceOptionId: string;
}

export default function NewBookingPage() {
  const router = useRouter();

  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [allOffers, setAllOffers] = useState<OfferOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [primaryName, setPrimaryName] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [primaryEmail, setPrimaryEmail] = useState('');
  const [source, setSource] = useState('whatsapp');
  const [notesPrivate, setNotesPrivate] = useState('');

  const [travelers, setTravelers] = useState<TravelerInput[]>([
    { fullName: '', contactPhone: '', priceOptionId: '' },
  ]);

  useEffect(() => {
    fetch('/api/studio/batches')
      .then((res) => res.json())
      .then((data) => {
        if (data.batches) setBatches(data.batches);
        if (data.offers) setAllOffers(data.offers);
        if (data.batches && data.batches.length > 0) {
          setSelectedBatchId(data.batches[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Filter offers for the selected batch
  const batchOffers = allOffers.filter((o) => o.batch_id === selectedBatchId);

  // Update default offer for travelers if batch changes and previous offer is invalid
  useEffect(() => {
    if (batchOffers.length > 0) {
      setTravelers((prev) =>
        prev.map((t) => ({
          ...t,
          priceOptionId: batchOffers.some((o) => o.offer_id === t.priceOptionId)
            ? t.priceOptionId
            : batchOffers[0].offer_id,
        }))
      );
    }
  }, [selectedBatchId, allOffers]);

  const addTraveler = () => {
    const defaultOffer = batchOffers[0]?.offer_id || '';
    setTravelers([
      ...travelers,
      { fullName: '', contactPhone: '', priceOptionId: defaultOffer },
    ]);
  };

  const removeTraveler = (index: number) => {
    if (travelers.length <= 1) return;
    setTravelers(travelers.filter((_, idx) => idx !== index));
  };

  const updateTraveler = (index: number, field: keyof TravelerInput, value: string) => {
    const updated = [...travelers];
    updated[index][field] = value;
    setTravelers(updated);
  };

  // Calculations
  const formatIDR = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);

  const totalAgreedPrice = travelers.reduce((sum, t) => {
    const offer = batchOffers.find((o) => o.offer_id === t.priceOptionId);
    return sum + (offer ? Number(offer.effective_price_idr) : 0);
  }, 0);

  const totalAgreedDp = travelers.reduce((sum, t) => {
    const offer = batchOffers.find((o) => o.offer_id === t.priceOptionId);
    return sum + (offer ? Number(offer.dp_per_traveler_idr) : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBatchId) {
      setError('Pilih batch perjalanan.');
      return;
    }
    if (!primaryName.trim() || !primaryPhone.trim()) {
      setError('Nama kontak utama dan nomor telepon/WhatsApp wajib diisi.');
      return;
    }

    for (let i = 0; i < travelers.length; i++) {
      if (!travelers[i].fullName.trim()) {
        setError(`Nama peserta ke-${i + 1} wajib diisi.`);
        return;
      }
      if (!travelers[i].priceOptionId) {
        setError(`Pilih paket harga untuk peserta ke-${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/studio/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          primaryContactName: primaryName.trim(),
          primaryContactPhone: primaryPhone.trim(),
          primaryContactEmail: primaryEmail.trim() || undefined,
          source,
          notesPrivate: notesPrivate.trim() || undefined,
          travelers: travelers.map((t) => ({
            fullName: t.fullName.trim(),
            contactPhone: t.contactPhone.trim() || primaryPhone.trim(),
            priceOptionId: t.priceOptionId,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat reservasi.');

      router.push(`/studio/bookings/${data.bookingId}`);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-xs text-neutral-500">Memuat data form reservasi...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-6">
        <Link
          href="/studio/bookings"
          className="p-2 rounded-lg border border-gray-300 text-neutral-600 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-[#1F1E1F]">
            Catat Reservasi Baru
          </h1>
          <p className="text-xs text-neutral-500">
            Input pemesanan manual dari lead WhatsApp atau rujukan offline.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-300 text-xs font-semibold text-neutral-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Trip & Batch Selection */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-display font-bold text-base text-neutral-900 border-b border-gray-100 pb-3">
            1. Pilih Batch Keberangkatan
          </h2>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Batch Perjalanan *
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900 focus:outline-none focus:border-[#5335FF]"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_code} — {b.series_name} ({b.destination_name}) | Berangkat: {b.departure_date} (Sisa: {b.remaining_seats} seat)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Section 2: Primary Contact Info */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <h2 className="font-display font-bold text-base text-neutral-900 border-b border-gray-100 pb-3">
            2. Kontak Utama (Pemesan)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nama Lengkap Kontak *
              </label>
              <input
                type="text"
                required
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                placeholder="Misal: Budi Santoso"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Nomor WhatsApp *
              </label>
              <input
                type="text"
                required
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                placeholder="08123456789 atau 62812..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Email (Opsional)
              </label>
              <input
                type="email"
                value={primaryEmail}
                onChange={(e) => setPrimaryEmail(e.target.value)}
                placeholder="budi@example.com"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Sumber Kontak
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
              >
                <option value="whatsapp">WhatsApp Inbound Direct</option>
                <option value="instagram">Instagram DM</option>
                <option value="referral">Rujukan Teman / Alumni</option>
                <option value="manual">Manual Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Catatan Internal Admin (Opsional)
            </label>
            <textarea
              rows={2}
              value={notesPrivate}
              onChange={(e) => setNotesPrivate(e.target.value)}
              placeholder="Preferensi diet, riwayat tanya jawab, kesepakatan cicilan..."
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white"
            />
          </div>
        </div>

        {/* Section 3: Travelers List */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-display font-bold text-base text-neutral-900">
              3. Daftar Peserta / Traveler ({travelers.length})
            </h2>
            <button
              type="button"
              onClick={addTraveler}
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1 text-neutral-800 transition-colors"
            >
              <Plus size={14} weight="bold" />
              <span>Tambah Peserta</span>
            </button>
          </div>

          <div className="space-y-4">
            {travelers.map((t, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Peserta #{idx + 1}
                  </span>
                  {travelers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTraveler(idx)}
                      className="text-neutral-400 hover:text-neutral-700 p-1"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      value={t.fullName}
                      onChange={(e) => updateTraveler(idx, 'fullName', e.target.value)}
                      placeholder="Nama sesuai KTP/Paspor"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      No. Kontak (Opsional)
                    </label>
                    <input
                      type="text"
                      value={t.contactPhone}
                      onChange={(e) => updateTraveler(idx, 'contactPhone', e.target.value)}
                      placeholder="Jika beda dari kontak utama"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      Pilihan Paket *
                    </label>
                    <select
                      value={t.priceOptionId}
                      onChange={(e) => updateTraveler(idx, 'priceOptionId', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-neutral-900"
                    >
                      {batchOffers.map((bo) => (
                        <option key={bo.offer_id} value={bo.offer_id}>
                          {bo.display_name} ({formatIDR(bo.effective_price_idr)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div>
              <div className="text-neutral-500">Estimasi Total Tagihan ({travelers.length} org)</div>
              <div className="font-mono font-bold text-lg text-neutral-900">
                {formatIDR(totalAgreedPrice)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500">Total DP Wajib Terkumpul</div>
              <div className="font-mono font-bold text-lg text-neutral-900">
                {formatIDR(totalAgreedDp)}
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            href="/studio/bookings"
            className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-neutral-700 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : 'Buat Reservasi & Lanjut Alokasi'}
          </button>
        </div>
      </form>
    </div>
  );
}
