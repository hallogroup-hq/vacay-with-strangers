'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUp,
  ArrowDown,
  Trash,
  Eye,
  EyeSlash,
  Plus,
  FloppyDisk,
  ArrowCounterClockwise,
  ArrowSquareOut,
  PencilSimple,
  Sparkle,
  Image as ImageIcon,
  CheckCircle,
  WarningCircle,
  DeviceMobile,
  DeviceTablet,
  Desktop,
  CaretRight,
  CaretDown,
  Rows,
  X,
  Compass,
  UsersThree,
  ShieldCheck,
  WhatsappLogo,
  Question,
  Article,
} from '@phosphor-icons/react';
import { PageConfig, PageSection, PageSectionItem } from '@/lib/cms/pageBuilderDefaults';

export default function PageBuilderStudioPage() {
  const [activePageId, setActivePageId] = useState<'home' | 'about' | 'terms'>('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [presetImages, setPresetImages] = useState<any[]>([]);
  const [availablePages, setAvailablePages] = useState<any[]>([]);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);

  // Load page configuration from API
  const loadPageData = async (pageId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/studio/page-builder?page=${pageId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat konfigurasi halaman');
      
      setPageConfig(data.pageConfig);
      setTemplates(data.templates || []);
      setPresetImages(data.presetImages || []);
      setAvailablePages(data.availablePages || []);

      if (data.pageConfig?.sections?.length > 0) {
        setActiveSectionId(data.pageConfig.sections[0].id);
      } else {
        setActiveSectionId(null);
      }
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData(activePageId);
  }, [activePageId]);

  // Current active section
  const activeSection = pageConfig?.sections.find((s) => s.id === activeSectionId) || pageConfig?.sections[0] || null;

  // Handle Save Page
  const handleSavePage = async () => {
    if (!pageConfig) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/studio/page-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_page',
          pageId: activePageId,
          config: pageConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan perubahan');
      setMessage({ text: 'Perubahan tampilan dan konten berhasil disimpan secara live!' });
      setPageConfig(data.pageConfig);
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Handle Reset Page
  const handleResetPage = async () => {
    if (!confirm('Apakah kamu yakin ingin mereset halaman ini ke konten awal? Perubahan yang belum disimpan akan hilang.')) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/studio/page-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_page',
          pageId: activePageId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset halaman');
      setMessage({ text: 'Halaman berhasil di-reset ke konten bawaan.' });
      setPageConfig(data.pageConfig);
      if (data.pageConfig?.sections?.length > 0) {
        setActiveSectionId(data.pageConfig.sections[0].id);
      }
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  // Section Ordering Helpers
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!pageConfig) return;
    const newSections = [...pageConfig.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    setPageConfig({ ...pageConfig, sections: newSections });
  };

  // Toggle Visibility
  const toggleSectionVisibility = (sectionId: string) => {
    if (!pageConfig) return;
    const newSections = pageConfig.sections.map((s) =>
      s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s
    );
    setPageConfig({ ...pageConfig, sections: newSections });
  };

  // Delete Section
  const deleteSection = (sectionId: string) => {
    if (!pageConfig) return;
    if (!confirm('Hapus section ini dari halaman?')) return;
    const newSections = pageConfig.sections.filter((s) => s.id !== sectionId);
    setPageConfig({ ...pageConfig, sections: newSections });
    if (activeSectionId === sectionId) {
      setActiveSectionId(newSections[0]?.id || null);
    }
  };

  // Add Section from Template
  const addSectionFromTemplate = (tmpl: any) => {
    if (!pageConfig) return;
    const uniqueId = `sec_${Date.now()}`;
    const newSec: PageSection = {
      ...tmpl.defaultSection,
      id: uniqueId,
      name: `${tmpl.name} (Baru)`,
    };

    const newSections = [...pageConfig.sections, newSec];
    setPageConfig({ ...pageConfig, sections: newSections });
    setActiveSectionId(uniqueId);
    setShowAddModal(false);
  };

  // Update Section Active Fields
  const updateActiveSectionField = (field: keyof PageSection, value: any) => {
    if (!pageConfig || !activeSection) return;
    const newSections = pageConfig.sections.map((s) =>
      s.id === activeSection.id ? { ...s, [field]: value } : s
    );
    setPageConfig({ ...pageConfig, sections: newSections });
  };

  // Update Item inside Active Section
  const updateSectionItem = (itemIndex: number, field: string, value: any) => {
    if (!pageConfig || !activeSection || !activeSection.items) return;
    const newItems = [...activeSection.items];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    updateActiveSectionField('items', newItems);
  };

  // Add Item to Active Section
  const addItemToSection = () => {
    if (!pageConfig || !activeSection) return;
    const newItem: PageSectionItem = {
      id: `item_${Date.now()}`,
      title: 'Item Baru',
      subtitle: 'Keterangan ringkas',
      description: 'Isi detail deskripsi untuk item ini.',
      badge: 'Baru',
      imageUrl: '/images/autumn-hero.jpg',
      linkUrl: '#',
    };
    const currentItems = activeSection.items || [];
    updateActiveSectionField('items', [...currentItems, newItem]);
  };

  // Delete Item from Active Section
  const deleteSectionItem = (itemIndex: number) => {
    if (!pageConfig || !activeSection || !activeSection.items) return;
    const newItems = activeSection.items.filter((_, idx) => idx !== itemIndex);
    updateActiveSectionField('items', newItems);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F4F6]">
      {/* =========================================================================
          1. TOP ACTION & NAVIGATION HEADER
      ========================================================================== */}
      <header className="sticky top-16 z-40 bg-white border-b border-black/10 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Page Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] mr-2 shrink-0">
              Pilih Halaman:
            </span>
            {[
              { id: 'home', label: 'Halaman Utama (Homepage)', path: '/' },
              { id: 'about', label: 'Tentang Kami & Manifesto', path: '/about' },
              { id: 'terms', label: 'Syarat & Kebijakan', path: '/terms' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePageId(p.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide whitespace-nowrap transition-all ${
                  activePageId === p.id
                    ? 'bg-[#121113] text-white shadow-xs'
                    : 'bg-[#FAF8F5] text-[#64748B] hover:text-[#121113] border border-black/5'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href={activePageId === 'home' ? '/' : `/${activePageId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#121113] hover:bg-[#FAF8F5] border border-black/10 text-xs font-bold transition-all"
            >
              <ArrowSquareOut size={16} />
              <span className="hidden sm:inline">Lihat Web Live</span>
            </Link>

            <button
              type="button"
              onClick={handleResetPage}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#64748B] hover:text-[#121113] border border-black/10 text-xs font-bold transition-all disabled:opacity-50"
              title="Reset ke konten default"
            >
              <ArrowCounterClockwise size={16} />
              <span className="hidden sm:inline">Reset Default</span>
            </button>

            <button
              type="button"
              onClick={handleSavePage}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#4E38FF] hover:bg-[#3d29db] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <FloppyDisk size={18} weight="bold" />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-t ${
              message.isError
                ? 'bg-neutral-100 text-neutral-900 border-neutral-300'
                : 'bg-neutral-900 text-white border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.isError ? <WarningCircle size={16} /> : <CheckCircle size={16} weight="fill" />}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-xs opacity-75 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. MAIN BUILDER WORKSPACE (3-COLUMN LAYOUT)
      ========================================================================== */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-12 text-[#64748B] text-sm">
          <span>Memuat komponen Page Builder...</span>
        </div>
      ) : (
        <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ---------------------------------------------------------------------
              COLUMN 1: SECTION LIST & REORDER (Col-span 3)
          ---------------------------------------------------------------------- */}
          <div className="lg:col-span-3 bg-white rounded-3xl border border-black/10 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-black/5 bg-[#FAF8F5] flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm text-[#121113]">
                  Struktur Section
                </h3>
                <span className="text-[11px] text-[#64748B]">
                  {pageConfig?.sections.length || 0} section terdaftar
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#121113] hover:bg-[#4E38FF] text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus size={14} weight="bold" />
                <span>Tambah</span>
              </button>
            </div>

            {/* List of Sections */}
            <div className="divide-y divide-black/5 max-h-[calc(100vh-250px)] overflow-y-auto">
              {pageConfig?.sections.map((sec, idx) => {
                const isActive = sec.id === activeSectionId;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isActive ? 'bg-[#FAF8F5] border-l-4 border-l-[#4E38FF]' : 'hover:bg-neutral-50'
                    } ${!sec.isVisible ? 'opacity-50' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-[#64748B]">
                          #{idx + 1}
                        </span>
                        <h4 className="font-display font-bold text-xs text-[#121113] truncate">
                          {sec.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-[#64748B] block truncate">
                        {sec.type} • {sec.items?.length ? `${sec.items.length} item` : 'Single'}
                      </span>
                    </div>

                    {/* Quick Section Controls */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(sec.id)}
                        className="p-1 text-[#64748B] hover:text-[#121113] rounded-md transition-colors"
                        title={sec.isVisible ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {sec.isVisible ? <Eye size={15} /> : <EyeSlash size={15} />}
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, 'up')}
                        className="p-1 text-[#64748B] hover:text-[#121113] disabled:opacity-20 rounded-md transition-colors"
                        title="Geser ke atas"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        type="button"
                        disabled={idx === (pageConfig?.sections.length || 1) - 1}
                        onClick={() => moveSection(idx, 'down')}
                        className="p-1 text-[#64748B] hover:text-[#121113] disabled:opacity-20 rounded-md transition-colors"
                        title="Geser ke bawah"
                      >
                        <ArrowDown size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSection(sec.id)}
                        className="p-1 text-neutral-400 hover:text-neutral-900 rounded-md transition-colors"
                        title="Hapus section"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------------------------
              COLUMN 2: ACTIVE SECTION DETAIL EDITOR (Col-span 5)
          ---------------------------------------------------------------------- */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-black/10 shadow-xs p-6 space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            {activeSection ? (
              <div className="space-y-6">
                
                {/* Header Section Info */}
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#4E38FF]">
                      Editor Section • {activeSection.type}
                    </span>
                    <h3 className="font-display font-extrabold text-lg text-[#121113]">
                      {activeSection.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#64748B] flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeSection.isVisible}
                        onChange={() => toggleSectionVisibility(activeSection.id)}
                        className="rounded border-black/20 text-[#4E38FF] focus:ring-0"
                      />
                      <span>Tampilkan di Web</span>
                    </label>
                  </div>
                </div>

                {/* Basic Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      Nama Section (Label Internal)
                    </label>
                    <input
                      type="text"
                      value={activeSection.name}
                      onChange={(e) => updateActiveSectionField('name', e.target.value)}
                      className="w-full text-xs sm:text-sm font-semibold border border-black/10 rounded-xl px-3.5 py-2 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      Badge Teks (Kecil di atas judul)
                    </label>
                    <input
                      type="text"
                      value={activeSection.badge || ''}
                      onChange={(e) => updateActiveSectionField('badge', e.target.value)}
                      placeholder="e.g. CURATED OPEN-TRIP"
                      className="w-full text-xs sm:text-sm border border-black/10 rounded-xl px-3.5 py-2 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      Judul Utama (Headline / Title)
                    </label>
                    <textarea
                      rows={2}
                      value={activeSection.title}
                      onChange={(e) => updateActiveSectionField('title', e.target.value)}
                      className="w-full text-xs sm:text-sm font-bold border border-black/10 rounded-xl px-3.5 py-2 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-1">
                      Deskripsi Paragraf / Subtitle
                    </label>
                    <textarea
                      rows={3}
                      value={activeSection.description || ''}
                      onChange={(e) => updateActiveSectionField('description', e.target.value)}
                      className="w-full text-xs sm:text-sm border border-black/10 rounded-xl px-3.5 py-2 bg-white text-[#121113] focus:outline-none focus:border-[#4E38FF]"
                    />
                  </div>
                </div>

                {/* CTA Buttons (if applicable) */}
                {(activeSection.primaryCtaText !== undefined || activeSection.type === 'hero' || activeSection.type === 'bottom_cta') && (
                  <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/5 space-y-3">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#121113]">
                      Pengaturan Tombol CTA
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Teks Tombol Utama
                        </label>
                        <input
                          type="text"
                          value={activeSection.primaryCtaText || ''}
                          onChange={(e) => updateActiveSectionField('primaryCtaText', e.target.value)}
                          placeholder="e.g. Jelajahi Jadwal"
                          className="w-full text-xs border border-black/10 rounded-lg px-3 py-1.5 bg-white text-[#121113]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Link URL Tombol Utama
                        </label>
                        <input
                          type="text"
                          value={activeSection.primaryCtaUrl || ''}
                          onChange={(e) => updateActiveSectionField('primaryCtaUrl', e.target.value)}
                          placeholder="e.g. #explore-trips"
                          className="w-full text-xs border border-black/10 rounded-lg px-3 py-1.5 bg-white text-[#121113]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Teks Tombol Sekunder
                        </label>
                        <input
                          type="text"
                          value={activeSection.secondaryCtaText || ''}
                          onChange={(e) => updateActiveSectionField('secondaryCtaText', e.target.value)}
                          placeholder="e.g. Tanya Admin"
                          className="w-full text-xs border border-black/10 rounded-lg px-3 py-1.5 bg-white text-[#121113]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Link URL Tombol Sekunder
                        </label>
                        <input
                          type="text"
                          value={activeSection.secondaryCtaUrl || ''}
                          onChange={(e) => updateActiveSectionField('secondaryCtaUrl', e.target.value)}
                          placeholder="e.g. https://wa.me/..."
                          className="w-full text-xs border border-black/10 rounded-lg px-3 py-1.5 bg-white text-[#121113]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Section Items Manager (Cards / Pillars / FAQs / Stories) */}
                <div className="pt-2 space-y-4">
                  <div className="flex items-center justify-between border-t border-black/5 pt-4">
                    <div>
                      <h4 className="font-display font-bold text-sm text-[#121113]">
                        Konten Kartu & Item ({activeSection.items?.length || 0})
                      </h4>
                      <p className="text-[11px] text-[#64748B]">
                        Ubah, hapus, atau tambahkan item di dalam section ini.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addItemToSection}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-neutral-200 text-[#121113] text-xs font-bold transition-all border border-black/5"
                    >
                      <Plus size={14} weight="bold" />
                      <span>Tambah Item</span>
                    </button>
                  </div>

                  {/* Items List */}
                  {activeSection.items && activeSection.items.length > 0 ? (
                    <div className="space-y-3">
                      {activeSection.items.map((item, itemIdx) => (
                        <div
                          key={item.id || itemIdx}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/5 space-y-3 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#121113]">
                              Item #{itemIdx + 1}: {item.title || 'Tanpa Judul'}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteSectionItem(itemIdx)}
                              className="text-neutral-400 hover:text-neutral-900 font-semibold text-[11px]"
                            >
                              Hapus Item
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                                Judul Item
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateSectionItem(itemIdx, 'title', e.target.value)}
                                className="w-full text-xs border border-black/10 rounded-lg px-2.5 py-1.5 bg-white text-[#121113]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                                Subtitle / Tag / Badge
                              </label>
                              <input
                                type="text"
                                value={item.subtitle || item.badge || item.tag || ''}
                                onChange={(e) => updateSectionItem(itemIdx, 'subtitle', e.target.value)}
                                className="w-full text-xs border border-black/10 rounded-lg px-2.5 py-1.5 bg-white text-[#121113]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                              Deskripsi / Isi Kutipan
                            </label>
                            <textarea
                              rows={2}
                              value={item.description || ''}
                              onChange={(e) => updateSectionItem(itemIdx, 'description', e.target.value)}
                              className="w-full text-xs border border-black/10 rounded-lg px-2.5 py-1.5 bg-white text-[#121113]"
                            />
                          </div>

                          {/* Image URL & Preset Selection (if applicable) */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-[#64748B]">
                              URL Gambar (Opsional)
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={item.imageUrl || ''}
                                onChange={(e) => updateSectionItem(itemIdx, 'imageUrl', e.target.value)}
                                placeholder="/images/..."
                                className="flex-1 text-xs border border-black/10 rounded-lg px-2.5 py-1.5 bg-white text-[#121113]"
                              />
                              <select
                                onChange={(e) => {
                                  if (e.target.value) updateSectionItem(itemIdx, 'imageUrl', e.target.value);
                                }}
                                defaultValue=""
                                className="text-xs border border-black/10 rounded-lg px-2 py-1.5 bg-white text-[#121113]"
                              >
                                <option value="" disabled>Pilih Preset...</option>
                                {presetImages.map((p, pIdx) => (
                                  <option key={pIdx} value={p.url}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Link URL (if applicable) */}
                          <div>
                            <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                              Link URL Tujuan
                            </label>
                            <input
                              type="text"
                              value={item.linkUrl || ''}
                              onChange={(e) => updateSectionItem(itemIdx, 'linkUrl', e.target.value)}
                              placeholder="/trips/..."
                              className="w-full text-xs border border-black/10 rounded-lg px-2.5 py-1.5 bg-white text-[#121113]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-black/15 text-center text-xs text-[#64748B]">
                      Tidak ada sub-item di section ini. Klik &quot;Tambah Item&quot; untuk menambahkan kartu/konten.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-16 text-[#64748B] text-xs">
                Pilih salah satu section di kolom kiri untuk mulai mengedit.
              </div>
            )}
          </div>

          {/* ---------------------------------------------------------------------
              COLUMN 3: LIVE INTERACTIVE PREVIEW (Col-span 4)
          ---------------------------------------------------------------------- */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-black/10 shadow-xs p-5 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-black/5 pb-3">
              <div>
                <h4 className="font-display font-extrabold text-xs uppercase tracking-wider text-[#121113]">
                  Live Preview
                </h4>
                <span className="text-[10px] text-[#64748B]">
                  Pratinjau tampilan langsung
                </span>
              </div>

              {/* Device Selector */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-black/5">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    previewDevice === 'desktop' ? 'bg-[#121113] text-white shadow-xs' : 'text-[#64748B]'
                  }`}
                  title="Desktop"
                >
                  <Desktop size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    previewDevice === 'tablet' ? 'bg-[#121113] text-white shadow-xs' : 'text-[#64748B]'
                  }`}
                  title="Tablet"
                >
                  <DeviceTablet size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg text-xs transition-all ${
                    previewDevice === 'mobile' ? 'bg-[#121113] text-white shadow-xs' : 'text-[#64748B]'
                  }`}
                  title="Mobile"
                >
                  <DeviceMobile size={14} />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div
              className={`mx-auto bg-[#FAF8F5] rounded-2xl border border-black/10 overflow-hidden shadow-inner p-4 space-y-6 transition-all ${
                previewDevice === 'mobile'
                  ? 'max-w-[340px] text-[11px]'
                  : previewDevice === 'tablet'
                  ? 'max-w-[480px] text-xs'
                  : 'w-full text-xs'
              }`}
            >
              {pageConfig?.sections
                .filter((s) => s.isVisible)
                .map((sec) => (
                  <div
                    key={sec.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      sec.id === activeSectionId
                        ? 'bg-white border-[#4E38FF] shadow-sm'
                        : 'bg-white/80 border-black/5'
                    }`}
                  >
                    {sec.badge && (
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#FD562A] block mb-1">
                        {sec.badge}
                      </span>
                    )}
                    <h5 className="font-display font-black text-sm text-[#121113] leading-snug">
                      {sec.title}
                    </h5>
                    {sec.description && (
                      <p className="font-body text-[11px] text-[#64748B] mt-1 line-clamp-3">
                        {sec.description}
                      </p>
                    )}

                    {/* Preview CTA Buttons */}
                    {sec.primaryCtaText && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-full bg-[#121113] text-white text-[10px] font-bold">
                          {sec.primaryCtaText}
                        </span>
                        {sec.secondaryCtaText && (
                          <span className="px-3 py-1 rounded-full bg-neutral-200 text-[#121113] text-[10px] font-bold">
                            {sec.secondaryCtaText}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Preview Items */}
                    {sec.items && sec.items.length > 0 && (
                      <div className="pt-3 space-y-1.5 border-t border-black/5 mt-3">
                        <span className="text-[9px] uppercase font-bold text-[#64748B] block">
                          Daftar Item ({sec.items.length}):
                        </span>
                        {sec.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-[#FAF8F5] border border-black/5 flex items-center justify-between text-[10px]"
                          >
                            <span className="font-bold text-[#121113] truncate max-w-[180px]">
                              {item.title}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 rounded-full bg-white text-[8px] font-bold text-[#4E38FF] border border-black/5">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          3. MODAL: TAMBAH SECTION BARU
      ========================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-black/10">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div>
                <h3 className="font-display font-extrabold text-xl text-[#121113]">
                  Tambah Section Baru
                </h3>
                <p className="text-xs text-[#64748B]">
                  Pilih salah satu template blok tampilan untuk ditambahkan ke halaman.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full hover:bg-neutral-100 text-[#64748B]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {templates.map((tmpl, idx) => (
                <div
                  key={idx}
                  onClick={() => addSectionFromTemplate(tmpl)}
                  className="p-4 rounded-2xl border border-black/10 hover:border-[#4E38FF] hover:bg-[#FAF8F5] cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-xs text-[#121113] group-hover:text-[#4E38FF]">
                      {tmpl.name}
                    </span>
                    <Plus size={14} className="text-[#64748B] group-hover:text-[#4E38FF]" />
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right border-t border-black/5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#121113]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
