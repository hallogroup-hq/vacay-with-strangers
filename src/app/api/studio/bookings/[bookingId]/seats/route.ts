import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth/session';
import { withTransaction } from '@/lib/db';
import { allocateSeatTransactional, releaseSeatTransactional } from '@/lib/finance/ledger';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { bookingId } = await params;
  const body = await req.json();
  const { bookingItemId, batchId, reason } = body;

  if (!bookingItemId || !batchId) {
    return NextResponse.json({ error: 'bookingItemId dan batchId wajib diisi' }, { status: 400 });
  }

  try {
    const allocationId = await withTransaction(async (client) => {
      return await allocateSeatTransactional(client, {
        batchId,
        bookingItemId,
        adminId: session.userId,
        reason: reason || 'Alokasi manual oleh admin',
      });
    });

    return NextResponse.json({ success: true, allocationId });
  } catch (err: any) {
    console.error('[API Allocate Seat] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal mengalokasikan seat' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { seatAllocationId, reason } = body;

  if (!seatAllocationId || !reason) {
    return NextResponse.json({ error: 'seatAllocationId dan alasan pelepasan wajib diisi' }, { status: 400 });
  }

  try {
    await withTransaction(async (client) => {
      await releaseSeatTransactional(client, {
        seatAllocationId,
        adminId: session.userId,
        reason,
      });
    });

    return NextResponse.json({ success: true, message: 'Seat berhasil dilepas.' });
  } catch (err: any) {
    console.error('[API Release Seat] Error:', err);
    return NextResponse.json({ error: err.message || 'Gagal melepas seat' }, { status: 400 });
  }
}
