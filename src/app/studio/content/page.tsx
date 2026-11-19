'use client';

import { useState, useEffect } from 'react';
import {
  Gear,
  Star,
  ChatCircleText,
  Plus,
  FloppyDisk,
  CheckCircle,
  Eye,
} from '@phosphor-icons/react';

export default function ContentStudioPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const [settings, setSettings] = useState<Record<string, any>>({});
  const [homepageFeatures, setHomepageFeatures] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);

  // Story modal state
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [editingStory, setEditingStory] = useState<any>({
    batch_id: '',
    headline: '',
    story_text: '',
    credited_name: '',
    consent_status: 'granted',
    publish_state: 'published',
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/studio/content').then((r) => r.json()),
      fetch('/api/studio/batches').then((r) => r.json()),
    ])
      .then(([cData, bData]) => {
        if (cData.settings) setSettings(cData.settings);
        if (cData.homepageFeatures) setHomepageFeatures(cData.homepageFeatures);
        if (cData.stories) setStories(cData.stories);
        if (bData.batches) {
          setBatches(bData.batches);
          if (bData.batches.length > 0 && !editingStory.batch_id) {
            setEditingStory((prev: any) => ({ ...prev, batch_id: bData.batches[0].id }));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/studio/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_settings',
          settings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');
      setMessage({ text: 'Pengaturan umum berhasil disimpan.' });
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSetFeaturedBatch = async (batchId: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/studio/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_featured_batch',
          batchId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memilih batch unggulan');
      setMessage({ text: 'Batch unggulan homepage berhasil disetel.' });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/studio/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_story',
          story: editingStory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan cerita');
      setShowStoryModal(false);
      setMessage({ text: 'Cerita petualang berhasil disimpan.' });
      loadData();
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-neutral-500">Memuat data Content Studio...</div>;
  }

  const currentFeaturedBatchId = homepageFeatures[0]?.batch_id || '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1E1F]">
          Content Studio & Pengaturan Publik
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Kelola sorotan homepage, nomor resmi WhatsApp, dan cerita petualang terverifikasi (Zero Slop).
        </p>
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

      {/* 1. Featured Homepage Trip */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Star size={18} className="text-neutral-700" />
          <h2 className="font-display font-bold text-base text-neutral-900">
            Batch Unggulan Homepage (Featured Next Adventure)
          </h2>
        </div>

        <p className="text-xs text-neutral-500">
          Pilih batch mana yang ditampilkan secara interaktif pada section &quot;Next Adventure&quot; di halaman beranda.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-xl">
          <select
            value={currentFeaturedBatchId}
            onChange={(e) => handleSetFeaturedBatch(e.target.value)}
            disabled={saving}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm bg-white text-neutral-900"
          >
            <option value="">-- Tidak ada (Otomatis batch terdekat) --</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_code} — {b.series_name} ({b.destination_name}) | {b.departure_date}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Global WhatsApp & Site Settings */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Gear size={18} className="text-neutral-700" />
          <h2 className="font-display font-bold text-base text-neutral-900">
            Identitas & Kontak Resmi
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1 text-xs">
                Nomor WhatsApp Resmi (CTA Seluruh Halaman)
              </label>
              <input
                type="text"
                required
                value={settings.whatsapp_number || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                placeholder="6285774999875"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 font-mono text-xs bg-white"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Gunakan format internasional tanpa tanda plus (+). Default resmi: 6285774999875.
              </p>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1 text-xs">
                Instagram Resmi
              </label>
              <input
                type="text"
                value={settings.instagram_handle || ''}
                onChange={(e) => setSettings({ ...settings, instagram_handle: e.target.value })}
                placeholder="@vacaywithstrangers"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1 text-xs">
                Nama Brand / Judul Situs
              </label>
              <input
                type="text"
                value={settings.site_title || ''}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                placeholder="Vacay With Strangers"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1 text-xs">
                Tagline Utama
              </label>
              <input
                type="text"
                value={settings.site_tagline || ''}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                placeholder="Open-Trip Travel Club for Strangers"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <FloppyDisk size={16} weight="bold" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Consented Traveler Stories */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <ChatCircleText size={18} className="text-neutral-700" />
            <h2 className="font-display font-bold text-base text-neutral-900">
              Cerita Petualang Nyata (Consented Stories)
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingStory({
                batch_id: batches[0]?.id || '',
                headline: '',
                story_text: '',
                credited_name: '',
                consent_status: 'granted',
                publish_state: 'published',
              });
              setShowStoryModal(true);
            }}
            className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1 text-neutral-800 transition-colors"
          >
            <Plus size={14} weight="bold" />
            <span>Tambah Cerita</span>
          </button>
        </div>

        <p className="text-xs text-neutral-500">
          Sesuai aturan anti AI-slop: Dilarang membuat review atau testimoni fiktif. Hanya cerita yang memiliki persetujuan (consent granted) yang dapat dipublikasikan.
        </p>

        <div className="space-y-3">
          {stories.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-xl text-xs text-neutral-400">
              Belum ada cerita petualang terdaftar.
            </div>
          ) : (
            stories.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="font-bold text-neutral-900 text-sm">{s.headline}</div>
                  <div className="text-xs text-neutral-600 line-clamp-2 max-w-2xl">{s.story_text}</div>
                  <div className="text-[11px] text-neutral-500 font-medium">
                    Oleh: {s.credited_name || 'Anonim'} • {s.batch_code} ({s.series_name})
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                    Consent: {s.consent_status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300">
                    {s.publish_state}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStory(s);
                      setShowStoryModal(true);
                    }}
                    className="text-xs font-semibold text-neutral-700 hover:text-[#5335FF] underline"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Story Editor */}
      {showStoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-display font-bold text-lg text-neutral-900">
              {editingStory.id ? 'Edit Cerita Petualang' : 'Tambah Cerita Petualang'}
            </h3>

            <form onSubmit={handleSaveStory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Batch Terkait *
                </label>
                <select
                  value={editingStory.batch_id}
                  onChange={(e) => setEditingStory({ ...editingStory, batch_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batch_code} — {b.series_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Judul Cerita / Headline *
                </label>
                <input
                  type="text"
                  required
                  value={editingStory.headline}
                  onChange={(e) => setEditingStory({ ...editingStory, headline: e.target.value })}
                  placeholder="Misal: Dari Orang Asing Jadi Sahabat di Salju Shirakawago"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Nama Penulis / Traveler *
                </label>
                <input
                  type="text"
                  required
                  value={editingStory.credited_name}
                  onChange={(e) => setEditingStory({ ...editingStory, credited_name: e.target.value })}
                  placeholder="Misal: Sarah & Dimas"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Isi Cerita / Pengalaman *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editingStory.story_text}
                  onChange={(e) => setEditingStory({ ...editingStory, story_text: e.target.value })}
                  placeholder="Cerita jujur perjalanan, suasana kelompok strangers, momen terbaik..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Status Persetujuan (Consent)
                  </label>
                  <select
                    value={editingStory.consent_status}
                    onChange={(e) => setEditingStory({ ...editingStory, consent_status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  >
                    <option value="granted">Granted (Diizinkan Publik)</option>
                    <option value="pending">Pending</option>
                    <option value="revoked">Revoked (Dicabut)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-700 mb-1">
                    Status Publikasi
                  </label>
                  <select
                    value={editingStory.publish_state}
                    onChange={(e) => setEditingStory({ ...editingStory, publish_state: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300"
                  >
                    <option value="published">Published (Tayang di Publik)</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-neutral-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-[#1F1E1F] text-white hover:bg-[#5335FF] font-semibold"
                >
                  Simpan Cerita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
