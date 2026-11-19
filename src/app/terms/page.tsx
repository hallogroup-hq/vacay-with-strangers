import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';

export default function TermsPage() {
  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-white py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="space-y-2 border-b border-gray-200 pb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#1F1E1F] tracking-tight">
              Syarat & Ketentuan Layanan
            </h1>
            <p className="text-xs text-neutral-500 font-mono">
              Terakhir diperbarui: 15 Oktober 2026
            </p>
          </div>

          <div className="prose prose-neutral text-sm text-neutral-700 space-y-6 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                1. Pemesanan & Alokasi Seat
              </h2>
              <p>
                Pemesanan trip dilakukan melalui komunikasi resmi tim VWS di WhatsApp. Alokasi kursi (seat) dianggap sah setelah peserta membayar Uang Muka (DP) yang telah diverifikasi oleh admin. Mengirim pesan atau menekan tombol WhatsApp di website tidak otomatis mengunci kuota kursi.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                2. Kebijakan Uang Muka (DP) & Pembatalan oleh Peserta
              </h2>
              <p>
                Uang Muka (DP) bersifat non-refundable (tidak dapat dikembalikan) jika pembatalan diajukan atas inisiatif peserta. Dana DP dialokasikan untuk reservasi tiket, penginapan, dan fasilitas awal yang tidak dapat dibatalkan secara sepihak kepada mitra operasional.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                3. Skema Cicilan & Batas Waktu Pelunasan (H-30)
              </h2>
              <p>
                Peserta yang memilih skema cicilan resmi wajib menyelesaikan seluruh kewajiban pembayaran paling lambat H-30 hari kalender sebelum tanggal keberangkatan batch bersangkutan. Keterlambatan pembayaran tanpa konfirmasi tertulis dapat mengakibatkan pembatalan keikutsertaan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                4. Penjadwalan Ulang (Reschedule)
              </h2>
              <p>
                Permohonan pindah batch atau penjadwalan ulang dinilai secara case-by-case oleh manajemen VWS. Pengalihan DP ke batch baru bergantung pada persetujuan tertulis admin dan ketersediaan kuota pada batch tujuan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-neutral-900 font-display">
                5. Penyesuaian Itinerary di Lapangan
              </h2>
              <p>
                Itinerary perjalanan dapat disesuaikan sewaktu-waktu oleh tour leader demi keselamatan dan kenyamanan seluruh peserta jika terjadi faktor cuaca buruk, force majeure, atau kendala transportasi lokal.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
