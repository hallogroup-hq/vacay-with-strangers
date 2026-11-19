import Link from 'next/link';
import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';

export default function NotFound() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center py-24 bg-white text-center px-4">
        <div className="max-w-md space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#F8F9FA] border border-gray-200 flex items-center justify-center font-display font-bold text-2xl text-[#1F1E1F] mx-auto">
            404
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F1E1F] tracking-tight">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Halaman atau jadwal trip yang kamu tuju mungkin telah dipindahkan, diarsipkan, atau tautan yang kamu masukkan kurang tepat.
          </p>
          <div className="pt-2">
            <Link
              href="/trips"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#1F1E1F] text-white text-xs font-semibold hover:bg-[#5335FF] transition-colors"
            >
              Kembali ke Jelajah Trip
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
