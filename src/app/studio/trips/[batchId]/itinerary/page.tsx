'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash, FloppyDisk, Clock, MapPin } from '@phosphor-icons/react';

export default function ItineraryEditorPage() {
  const params = useParams();
  const batchId = params.batchId as string;

  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/studio/batches/${batchId}/itinerary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.days) setDays(data.days);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [batchId]);

  const addDay = () => {
    const nextDayNo = days.length + 1;
    setDays([
      ...days,
      {
        day_no: nextDayNo,
        title: `Hari ${nextDayNo}`,
        description: '',
        activities: [],
      },
    ]);
  };

  const removeDay = (dayIndex: number) => {
    if (!confirm(`Hapus Hari ke-${days[dayIndex].day_no}?`)) return;
    const updated = days.filter((_, idx) => idx !== dayIndex);
    // Re-index day_no
    updated.forEach((d, idx) => {
      d.day_no = idx + 1;
    });
    setDays(updated);
  };

  const updateDayField = (dayIndex: number, field: string, value: any) => {
    const updated = [...days];
    updated[dayIndex][field] = value;
    setDays(updated);
  };

  const addActivity = (dayIndex: number) => {
    const updated = [...days];
    if (!updated[dayIndex].activities) updated[dayIndex].activities = [];
    updated[dayIndex].activities.push({
      start_local_time: '09:00',
      activity_type: 'general',
      title: 'Aktivitas Baru',
      location_name: '',
      is_optional: false,
    });
    setDays(updated);
  };

  const updateActivityField = (dayIndex: number, actIndex: number, field: string, value: any) => {
    const updated = [...days];
    updated[dayIndex].activities[actIndex][field] = value;
    setDays(updated);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const updated = [...days];
    updated[dayIndex].activities.splice(actIndex, 1);
    setDays(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/studio/batches/${batchId}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan itinerary');

      setMessage({ text: data.message || 'Itinerary berhasil disimpan sebagai draf.' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Gagal menyimpan', isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-xs text-neutral-500">Memuat data itinerary...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
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
              Editor Itinerary Hari demi Hari
            </h1>
            <p className="text-xs text-neutral-500">
              Susun agenda perjalanan per hari lengkap dengan waktu dan aktivitas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={addDay}
            className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} weight="bold" />
            <span>Tambah Hari</span>
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

      {/* Days List */}
      <div className="space-y-6">
        {days.map((day, dIdx) => (
          <div
            key={dIdx}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="w-8 h-8 rounded-lg bg-[#1F1E1F] text-white flex items-center justify-center font-display font-bold text-xs shrink-0">
                  H{day.day_no}
                </span>
                <input
                  type="text"
                  value={day.title}
                  onChange={(e) => updateDayField(dIdx, 'title', e.target.value)}
                  placeholder={`Judul Hari ${day.day_no}`}
                  className="font-display font-bold text-base sm:text-lg text-neutral-900 border-b border-transparent hover:border-gray-300 focus:border-[#5335FF] focus:outline-none px-1 py-0.5 w-full max-w-md bg-transparent"
                />
              </div>

              <button
                type="button"
                onClick={() => removeDay(dIdx)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 transition-colors"
                title="Hapus hari ini"
              >
                <Trash size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 mb-1">
                Deskripsi / Cerita Hari
              </label>
              <textarea
                rows={2}
                value={day.description || ''}
                onChange={(e) => updateDayField(dIdx, 'description', e.target.value)}
                placeholder="Rangkuman aktivitas yang akan dinikmati bersama..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
              />
            </div>

            {/* Activities for this Day */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Rangkaian Aktivitas ({day.activities?.length || 0})
                </span>
                <button
                  type="button"
                  onClick={() => addActivity(dIdx)}
                  className="text-xs font-semibold text-[#5335FF] hover:underline flex items-center gap-1"
                >
                  <Plus size={14} weight="bold" />
                  <span>Tambah Aktivitas</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {day.activities?.map((act: any, aIdx: number) => (
                  <div
                    key={aIdx}
                    className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                  >
                    <input
                      type="text"
                      value={act.start_local_time || ''}
                      onChange={(e) => updateActivityField(dIdx, aIdx, 'start_local_time', e.target.value)}
                      placeholder="09:00"
                      className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-mono text-center bg-white"
                    />

                    <select
                      value={act.activity_type}
                      onChange={(e) => updateActivityField(dIdx, aIdx, 'activity_type', e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white text-neutral-800"
                    >
                      <option value="general">Umum</option>
                      <option value="transport">Transportasi / Transit</option>
                      <option value="meal">Makan Bersama</option>
                      <option value="highlight">Highlight Destinasi</option>
                      <option value="optional">Aktivitas Opsional</option>
                      <option value="flight">Penerbangan</option>
                    </select>

                    <input
                      type="text"
                      value={act.title}
                      onChange={(e) => updateActivityField(dIdx, aIdx, 'title', e.target.value)}
                      placeholder="Nama kegiatan"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs sm:text-sm bg-white"
                    />

                    <input
                      type="text"
                      value={act.location_name || ''}
                      onChange={(e) => updateActivityField(dIdx, aIdx, 'location_name', e.target.value)}
                      placeholder="Lokasi (misal: Suwa Lake)"
                      className="w-40 px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white"
                    />

                    <button
                      type="button"
                      onClick={() => removeActivity(dIdx, aIdx)}
                      className="text-neutral-400 hover:text-neutral-700 p-1"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
