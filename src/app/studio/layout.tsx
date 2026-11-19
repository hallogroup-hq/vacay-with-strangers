import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/auth/session';
import {
  Compass,
  UsersThree,
  CreditCard,
  Article,
  SignOut,
  ArrowSquareOut,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr';

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Route protection: if path is not /studio/login and not authenticated, redirect
  // Note: in Next.js layout, we check session here
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col text-[#1F1E1F]">
      {session && (
        <header className="sticky top-0 z-50 bg-[#1F1E1F] text-white border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Brand Logo & Studio title */}
            <div className="flex items-center gap-6">
              <Link href="/studio" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white text-[#1F1E1F] flex items-center justify-center font-display font-bold text-sm">
                  VWS
                </div>
                <span className="font-display font-bold text-base tracking-tight text-white">
                  Studio
                </span>
              </Link>

              {/* Primary Studio Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  href="/studio"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Trip & Batch
                </Link>
                <Link
                  href="/studio/builder"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white hover:text-[#D4FF00] hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  <Sparkle size={14} weight="fill" className="text-[#FD562A]" />
                  <span>Page Builder</span>
                </Link>
                <Link
                  href="/studio/bookings"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Pemesanan & Seat
                </Link>
                <Link
                  href="/studio/payments"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Pembayaran & Kas
                </Link>
                <Link
                  href="/studio/content"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Konten & Pengaturan
                </Link>
              </nav>
            </div>

            {/* Right side: Public view link, Admin identity, Logout */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="hidden sm:flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                <span>Lihat Website</span>
                <ArrowSquareOut size={14} />
              </Link>

              <div className="flex items-center gap-3 pl-3 border-l border-neutral-800">
                <span className="text-xs font-medium text-neutral-300 hidden sm:inline">
                  {session.fullName}
                </span>

                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs"
                    title="Keluar"
                  >
                    <SignOut size={18} />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
