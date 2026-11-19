import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import { getAdminSession } from '@/lib/auth/session';
import { query, withTransaction } from '@/lib/db';
import { logAuditEvent } from '@/lib/finance/ledger';
import {
  getPageConfig,
  SECTION_TEMPLATES,
  DEFAULT_HOME_PAGE_CONFIG,
  DEFAULT_ABOUT_PAGE_CONFIG,
  DEFAULT_TERMS_PAGE_CONFIG,
  PageConfig,
} from '@/lib/cms/pageBuilderDefaults';

const AVAILABLE_PRESET_IMAGES = [
  { label: 'Japan Autumn Countryside', url: '/images/autumn-hero.jpg' },
  { label: 'Japan Autumn Itinerary', url: '/images/autumn-itinerary.jpg' },
  { label: 'Japan Winter Snow', url: '/images/winter-hero.jpg' },
  { label: 'China Yunnan & Shangri-La', url: '/images/destinations/china.jpg' },
  { label: 'Vietnam Hanoi, Sapa & Da Nang', url: '/images/destinations/vietnam.jpg' },
  { label: 'Central Asia Kazakhstan & Kyrgyzstan', url: '/images/destinations/kazakhstan.jpg' },
  { label: 'Circle Story - Group Moment', url: '/images/stories/story-group.jpg' },
  { label: 'Circle Story - Mountain Trek', url: '/images/stories/story-mountain.jpg' },
  { label: 'Circle Story - Road Journey', url: '/images/stories/story-road.jpg' },
];

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pageId = searchParams.get('page') || 'home';

  try {
    const pageConfig = await getPageConfig(pageId);
    return NextResponse.json({
      success: true,
      pageConfig,
      templates: SECTION_TEMPLATES,
      presetImages: AVAILABLE_PRESET_IMAGES,
      availablePages: [
        { id: 'home', title: 'Halaman Utama (Homepage)' },
        { id: 'about', title: 'Tentang Kami & Manifesto (/about)' },
        { id: 'terms', title: 'Syarat & Kebijakan (/terms)' },
      ],
    });
  } catch (err: any) {
    console.error('[API Page Builder GET] Error:', err);
    return NextResponse.json(
      { error: 'Gagal memuat konfigurasi halaman.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, pageId, config, pageConfig } = body;
    const targetConfig = config || pageConfig;
    const targetPageId = pageId || targetConfig?.pageId || 'home';
    const key = `cms_page_${targetPageId}`;

    if (action === 'reset_page') {
      let defaultConfig: PageConfig = DEFAULT_HOME_PAGE_CONFIG;
      if (targetPageId === 'about') defaultConfig = DEFAULT_ABOUT_PAGE_CONFIG;
      if (targetPageId === 'terms') defaultConfig = DEFAULT_TERMS_PAGE_CONFIG;

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO site_settings (key, value_json, updated_by_admin, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE
           SET value_json = EXCLUDED.value_json,
               updated_by_admin = EXCLUDED.updated_by_admin,
               updated_at = CURRENT_TIMESTAMP`,
          [key, JSON.stringify(defaultConfig), session.userId]
        );

        await logAuditEvent(client, {
          adminUserId: session.userId,
          entityType: 'page_builder',
          entityId: randomUUID(),
          eventType: 'page_reset_to_default',
          reason: `Reset page: ${targetPageId}`,
          afterJson: defaultConfig,
        });
      });

      const pathToRevalidate = targetPageId === 'home' ? '/' : `/${targetPageId}`;
      try {
        revalidatePath(pathToRevalidate);
      } catch (e) {
        // Safe fallback in non-request context
      }

      return NextResponse.json({
        success: true,
        message: `Halaman ${targetPageId} berhasil di-reset ke pengaturan awal.`,
        pageConfig: defaultConfig,
      });
    }

    if (action === 'save_page') {
      if (!targetConfig || !Array.isArray(targetConfig.sections)) {
        return NextResponse.json(
          { error: 'Format konfigurasi halaman tidak valid.' },
          { status: 400 }
        );
      }

      const updatedConfig: PageConfig = {
        pageId: targetPageId,
        pageTitle: targetConfig.pageTitle || 'Untitled Page',
        updatedAt: new Date().toISOString(),
        sections: targetConfig.sections,
      };

      await withTransaction(async (client) => {
        await client.query(
          `INSERT INTO site_settings (key, value_json, updated_by_admin, updated_at)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
           ON CONFLICT (key) DO UPDATE
           SET value_json = EXCLUDED.value_json,
               updated_by_admin = EXCLUDED.updated_by_admin,
               updated_at = CURRENT_TIMESTAMP`,
          [key, JSON.stringify(updatedConfig), session.userId]
        );

        await logAuditEvent(client, {
          adminUserId: session.userId,
          entityType: 'page_builder',
          entityId: randomUUID(),
          eventType: 'page_content_updated',
          reason: `Update page: ${targetPageId}`,
          afterJson: updatedConfig,
        });
      });

      const pathToRevalidate = targetPageId === 'home' ? '/' : `/${targetPageId}`;
      try {
        revalidatePath(pathToRevalidate);
      } catch (e) {
        // Safe fallback in non-request context
      }

      return NextResponse.json({
        success: true,
        message: 'Perubahan tampilan dan konten berhasil disimpan secara live!',
        pageConfig: updatedConfig,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API Page Builder POST] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan sistem saat menyimpan konten.' },
      { status: 500 }
    );
  }
}
