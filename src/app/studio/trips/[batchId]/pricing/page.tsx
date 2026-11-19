'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash, FloppyDisk, Tag } from '@phosphor-icons/react';

interface PriceOption {
  id?: string;
  sku?: string;
  display_name: string;
  package_type: 'full_package' | 'land_only';
  room_type: 'sharing' | 'private';
  list_price_idr: number;
  promo_price_idr?: number | null;
  promo_start_at?: string | null;
  promo_end_at?: string | null;
  dp_per_traveler_idr: number;
  included_json: string[];
  excluded_json: string[];
  land_meeting_info?: string | null;
  is_enabled: boolean;
}

export default function PricingEditorPage() {
  const params = useParams();
  const batchId = params.batchId as string;

  const [priceOptions, setPriceOptions] = useState<PriceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/studio/batches/${batchId}/pricing`)
      .then((res) => res.json())
      .then((data) => {
        if (data.priceOptions) {
          const parsed = data.priceOptions.map((po: any) => ({
            ...po,
            included_json: Array.isArray(po.included_json) ? po.included_json : [],
            excluded_json: Array.isArray(po.excluded_json) ? po.excluded_json : [],
          }));
          setPriceOptions(parsed);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [batchId]);

  const addOption = () => {
    setPriceOptions([
      ...priceOptions,
      {
        display_name: 'Paket Baru',
        package_type: 'full_package',
        room_type: 'sharing',
        list_price_idr: 0,
        promo_price_idr: null,
        dp_per_traveler_idr: 0,
        included_json: ['Akomodasi hotel bintang 3-4 (sharing room)', 'Transportasi selama tour'],
        excluded_json: ['Pengeluaran pribadi', 'Visa & asuransi perjalanan'],
        land_meeting_info: null,
        is_enabled: true,
      },
    ]);
  };

  const removeOption = (index: number) => {
    if (!confirm('Hapus paket harga ini?')) return;
    setPriceOptions(priceOptions.filter((_, idx) => idx !== index));
  };

  const updateField = (index: number, field: keyof PriceOption, value: any) => {
    const updated = [...priceOptions];
    (updated[index] as any)[field] = value;
    setPriceOptions(updated);
  };

  const handleArrayItemAdd = (optionIndex: number, field: 'included_json' | 'excluded_json', text: string) => {
    if (!text.trim()) return;
    const updated = [...priceOptions];
    updated[optionIndex][field] = [...updated[optionIndex][field], text.trim()];
    setPriceOptions(updated);
  };

  const handleArrayItemRemove = (optionIndex: number, field: 'included_json' | 'excluded_json', itemIndex: number) => {
    const updated = [...priceOptions];
    updated[optionIndex][field] = updated[optionIndex][field].filter((_, idx) => idx !== itemIndex);
    setPriceOptions(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/studio/batches/${batchId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceOptions }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan harga');

      setMessage({ text: data.message || 'Harga dan paket berhasil disimpan sebagai draf.' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menyimpan', isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-xs text-neutral-500">Memuat data paket & harga...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/studio/trips/${batchId}`}
            className="p-2 rounded-lg border border-gray-300 text-neutral-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-[#1F1E1F]">
              Editor Paket & Harga
            </h1>
            <p className="text-xs text-neutral-500">
              Kelola opsi Full Package, Land Tour Only, promo berbatas waktu, dan DP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addOption}
            className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Paket</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Draf'}</span>
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-xs sm:text-sm font-semibold">
        <Link
          href={`/studio/trips/${batchId}`}
          className="pb-3 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          Pengaturan & Publikasi
        </Link>
        <Link
          href={`/studio/trips/${batchId}/itinerary`}
          className="pb-3 text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          Itinerary Hari demi Hari
        </Link>
        <Link
          href={`/studio/trips/${batchId}/pricing`}
          className="pb-3 text-[#1F1E1F] border-b-2 border-[#1F1E1F]"
        >
          Paket & Harga
        </Link>
      </div>

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

      {/* Pricing Options List */}
      <div className="space-y-6">
        {priceOptions.length === 0 && (
          <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-xs text-neutral-500">
            Belum ada paket harga yang ditambahkan. Klik &quot;Tambah Paket&quot; untuk memulai.
          </div>
        )}

        {priceOptions.map((opt, oIdx) => (
          <div
            key={oIdx}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-neutral-100 text-neutral-700">
                  <Tag size={18} />
                </span>
                <input
                  type="text"
                  value={opt.display_name}
                  onChange={(e) => updateField(oIdx, 'display_name', e.target.value)}
                  placeholder="Nama Paket (misal: Full Package)"
                  className="font-display font-bold text-lg text-neutral-900 border-b border-transparent hover:border-gray-300 focus:border-[#5335FF] focus:outline-none px-1 py-0.5 bg-transparent"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.is_enabled}
                    onChange={(e) => updateField(oIdx, 'is_enabled', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Aktif di Publik</span>
                </label>
                <button
                  type="button"
                  onClick={() => removeOption(oIdx)}
                  className="text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>

            {/* Core Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Tipe Paket
                </label>
                <select
                  value={opt.package_type}
                  onChange={(e) => updateField(oIdx, 'package_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white text-neutral-900"
                >
                  <option value="full_package">Full Package (Include Tiket Pesawat)</option>
                  <option value="land_only">Land Tour Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Tipe Kamar
                </label>
                <select
                  value={opt.room_type}
                  onChange={(e) => updateField(oIdx, 'room_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white text-neutral-900"
                >
                  <option value="sharing">Sharing Room (Standar)</option>
                  <option value="private">Private Room (Tambahan Biaya)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Harga Normal (IDR)
                </label>
                <input
                  type="number"
                  value={opt.list_price_idr || 0}
                  onChange={(e) => updateField(oIdx, 'list_price_idr', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono bg-white text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Down Payment (DP) / Orang (IDR)
                </label>
                <input
                  type="number"
                  value={opt.dp_per_traveler_idr || 0}
                  onChange={(e) => updateField(oIdx, 'dp_per_traveler_idr', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono bg-white text-neutral-900"
                />
              </div>
            </div>

            {/* Promo Settings */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                Opsi Promo / Diskon (Opsional)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Harga Promo (IDR)
                  </label>
                  <input
                    type="number"
                    value={opt.promo_price_idr || ''}
                    onChange={(e) => updateField(oIdx, 'promo_price_idr', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Kosongkan bila normal"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Promo Mulai
                  </label>
                  <input
                    type="date"
                    value={opt.promo_start_at ? opt.promo_start_at.slice(0, 10) : ''}
                    onChange={(e) => updateField(oIdx, 'promo_start_at', e.target.value || null)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Promo Berakhir
                  </label>
                  <input
                    type="date"
                    value={opt.promo_end_at ? opt.promo_end_at.slice(0, 10) : ''}
                    onChange={(e) => updateField(oIdx, 'promo_end_at', e.target.value || null)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Land Meeting Point Info */}
            {opt.package_type === 'land_only' && (
              <div>
                <label className="block text-xs font-bold text-neutral-600 mb-1">
                  Info Titik Kumpul (Meeting Point Land Tour)
                </label>
                <input
                  type="text"
                  value={opt.land_meeting_info || ''}
                  onChange={(e) => updateField(oIdx, 'land_meeting_info', e.target.value)}
                  placeholder="Misal: Bandara Haneda Terminal 3 jam 14:00 waktu setempat"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                />
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Included Items */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-700 block">
                  Termasuk dalam Paket ({opt.included_json.length})
                </span>
                <div className="space-y-2">
                  {opt.included_json.map((inc, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <span>{inc}</span>
                      <button
                        type="button"
                        onClick={() => handleArrayItemRemove(oIdx, 'included_json', iIdx)}
                        className="text-neutral-400 hover:text-neutral-700 ml-2"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah poin fasilitas..."
                      id={`inc-input-${oIdx}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          handleArrayItemAdd(oIdx, 'included_json', val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`inc-input-${oIdx}`) as HTMLInputElement;
                        if (input && input.value) {
                          handleArrayItemAdd(oIdx, 'included_json', input.value);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* Excluded Items */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-700 block">
                  Tidak Termasuk ({opt.excluded_json.length})
                </span>
                <div className="space-y-2">
                  {opt.excluded_json.map((exc, eIdx) => (
                    <div key={eIdx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 border border-gray-200">
                      <span>{exc}</span>
                      <button
                        type="button"
                        onClick={() => handleArrayItemRemove(oIdx, 'excluded_json', eIdx)}
                        className="text-neutral-400 hover:text-neutral-700 ml-2"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tambah poin pengecualian..."
                      id={`exc-input-${oIdx}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value;
                          handleArrayItemAdd(oIdx, 'excluded_json', val);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(`exc-input-${oIdx}`) as HTMLInputElement;
                        if (input && input.value) {
                          handleArrayItemAdd(oIdx, 'excluded_json', input.value);
                          input.value = '';
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-semibold text-neutral-800"
                    >
                      Tambah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
