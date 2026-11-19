'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] px-4 py-16 text-center">
      <div className="max-w-md p-8 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-4">
        <h2 className="font-display font-bold text-xl text-[#1F1E1F]">
          Terjadi Kendala Memuat Data
        </h2>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Sistem kami mendeteksi kendala koneksi atau pemuatan halaman. Silakan muat ulang halaman.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-full bg-[#1F1E1F] text-white text-xs font-semibold hover:bg-[#5335FF] transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-full border border-gray-300 text-neutral-700 text-xs font-semibold hover:bg-gray-100 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
