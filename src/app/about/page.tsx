import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';
import { WhatsappLogo, ShieldCheck, Heart, Sparkle, ArrowRight, InstagramLogo } from '@phosphor-icons/react/dist/ssr';
import { OFFICIAL_WA_NUMBER } from '@/lib/whatsapp/generator';
import BrandLogo from '@/components/brand/BrandLogo';

export default function AboutPage() {
  return (
    <>
      <PublicHeader />

      <main className="flex-1 bg-[#FAF8F5]">
        {/* Header */}
        <section className="bg-white border-b border-black/5 py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-black/5 text-xs font-bold uppercase tracking-widest text-[#4E38FF]">
                <Sparkle size={16} weight="fill" />
                <span>The Strangers Story</span>
              </span>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#121113] tracking-tight leading-tight">
                Travel Fun. Travel Together.
              </h1>

              <p className="font-body text-base sm:text-lg text-[#64748B] leading-relaxed">
                Vacay With Strangers didirikan untuk siapa pun yang ingin menjelajahi dunia tanpa harus terhalang teman yang wacana. Kami mempertemukan solo traveler, Gen Z, dan first-jobber dalam circle kecil yang akrab dan saling menghargai.
              </p>
            </div>
          </div>
        </section>

        {/* Premise & Values */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#FD562A] block">
                  Filosofi Perjalanan
                </span>
                <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#121113] tracking-tight">
                  Kenapa Bepergian dengan Strangers?
                </h2>
                <p className="font-body text-sm sm:text-base text-[#64748B] leading-relaxed">
                  Berapa kali rencana liburan impianmu tertunda karena teman-temanmu berbeda jadwal, budget, atau sering membatalkan janji? Di VWS, kamu tidak perlu menunggu siapa pun. Daftarkan dirimu, dan biarkan kami mengatur rute serta mempertemukanmu dengan sesama traveler yang sefrekuensi.
                </p>
                <div className="pt-2">
                  <span className="font-display font-bold text-lg text-[#121113] block">
                    &quot;Berangkat sebagai orang asing, pulang membawa sahabat.&quot;
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-xs space-y-6">
                <h3 className="font-display font-bold text-xl text-[#121113]">
                  3 Standar Kurasi VWS
                </h3>
                <ul className="space-y-4 text-xs sm:text-sm text-[#64748B]">
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#4E38FF]/10 text-[#4E38FF] flex items-center justify-center shrink-0 font-display font-bold text-sm">
                      1
                    </div>
                    <div>
                      <strong className="block text-[#121113] font-display font-bold text-base">Transparansi Biaya & Rute</strong>
                      Semua fasilitas yang termasuk dan tidak termasuk dijabarkan dengan jelas tanpa hidden cost.
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#FD562A]/10 text-[#FD562A] flex items-center justify-center shrink-0 font-display font-bold text-sm">
                      2
                    </div>
                    <div>
                      <strong className="block text-[#121113] font-display font-bold text-base">Circle Intim (Max 12-14 Peserta)</strong>
                      Kapasitas dibatasi ketat agar suasana akrab dan eksplorasi di lapangan tetap leluasa tanpa drama tur rombongan besar.
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-xl bg-[#D4FF00] text-[#121113] flex items-center justify-center shrink-0 font-display font-bold text-sm">
                      3
                    </div>
                    <div>
                      <strong className="block text-[#121113] font-display font-bold text-base">Skema Cicilan Ramah First-Jobber</strong>
                      Mendukung perencanaan keuangan anak muda melalui angsuran bulanan yang transparan hingga batas H-30 tanpa pinjol.
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Official Contact Box */}
            <div className="bg-[#121113] text-white rounded-3xl p-8 sm:p-12 space-y-6 shadow-xl">
              <div className="max-w-xl space-y-2">
                <h3 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                  Hubungi Tim & Komunitas Resmi
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                  Seluruh komunikasi pendaftaran dan konsultasi resmi kami hanya dilayani melalui nomor WhatsApp dan akun Instagram resmi di bawah ini.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm pt-2">
                <a
                  href={`https://wa.me/${OFFICIAL_WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#FD562A] text-white font-bold hover:bg-[#4E38FF] transition-all shadow-sm"
                >
                  <WhatsappLogo size={20} weight="fill" />
                  <span>WhatsApp Resmi: +62 857-7499-9875</span>
                </a>
                <a
                  href="https://instagram.com/vacaywithstrangers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/10"
                >
                  <InstagramLogo size={20} weight="fill" className="text-[#FD562A]" />
                  <span>@vacaywithstrangers</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
