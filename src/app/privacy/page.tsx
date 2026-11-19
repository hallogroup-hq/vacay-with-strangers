import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';

export default function PrivacyPage() {
  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-white py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 border-b border-gray-200 pb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1E1F] tracking-tight">
              Kebijakan Privasi
            </h1>
            <p className="text-xs text-neutral-500 font-mono">
              Terakhir diperbarui: 15 Oktober 2026
            </p>
          </div>

          <div className="prose prose-neutral text-sm text-neutral-700 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                1. Data yang Dikumpulkan
              </h2>
              <p>
                Kami hanya mengumpulkan data pribadi esensial yang diberikan secara sukarela saat pendaftaran trip, meliputi nama lengkap, nomor kontak WhatsApp, dan informasi preferensi paket. Kami tidak meminta atau menyimpan data sensitif yang tidak diperlukan untuk operasional perjalanan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                2. Penggunaan Data Pribadi
              </h2>
              <p>
                Informasi peserta digunakan secara eksklusif untuk koordinasi pemesanan tiket penerbangan, akomodasi hotel, transportasi lokal, pembuatan manifes perjalanan, dan komunikasi darurat selama trip berlangsung.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                3. Dokumentasi Foto & Video (Consent)
              </h2>
              <p>
                Dokumentasi foto dan video selama perjalanan yang menampilkan peserta hanya dipublikasikan untuk keperluan media sosial dan arsip situs web dengan persetujuan (consent) yang bersangkutan. Peserta berhak mengajukan permohonan penarikan (takedown) foto pribadi kapan saja melalui admin kami.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                4. Keamanan Informasi
              </h2>
              <p>
                Seluruh data administratif disimpan pada server aman dengan akses tunggal terotentikasi. Kami tidak pernah menjual, menyewakan, atau membagikan data peserta kepada pihak ketiga untuk kepentingan komersial non-operasional.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
