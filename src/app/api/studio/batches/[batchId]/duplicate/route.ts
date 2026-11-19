import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { duplicateBatchDraft } from '@/lib/db/queries';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { batchId } = await params;
  const body = await req.json();
  const { newBatchCode, newDepartureDate, newReturnDate } = body;

  if (!newBatchCode || !newDepartureDate || !newReturnDate) {
    return NextResponse.json(
      { error: 'Batch code baru, tanggal berangkat, dan tanggal kepulangan wajib diisi.' },
      { status: 400 }
    );
  }

  try {
    const newBatchId = await duplicateBatchDraft(
      batchId,
      newBatchCode,
      newDepartureDate,
      newReturnDate,
      session.userId
    );

    return NextResponse.json({
      success: true,
      newBatchId,
      message: 'Batch berhasil diduplikasi sebagai draf baru.',
    });
  } catch (err: any) {
    console.error('[API Duplicate Batch] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal menduplikasi batch' }, { status: 500 });
  }
}
