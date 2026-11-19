import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, setAdminSessionCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.username || body.email;
    const { password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/Email dan password wajib diisi.' },
        { status: 400 }
      );
    }

    const session = await authenticateAdmin(identifier, password);
    if (!session) {
      return NextResponse.json(
        { error: 'Kredensial login tidak valid.' },
        { status: 401 }
      );
    }

    await setAdminSessionCookie(session);

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        fullName: session.fullName,
        role: session.role,
      },
    });
  } catch (error) {
    console.error('[API Auth Login] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}
