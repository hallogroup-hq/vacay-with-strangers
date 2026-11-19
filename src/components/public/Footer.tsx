import Link from 'next/link';
import { WhatsappLogo, InstagramLogo, ArrowUpRight, ShieldCheck, Heart } from '@phosphor-icons/react/dist/ssr';
import { OFFICIAL_WA_NUMBER } from '@/lib/whatsapp/generator';
import BrandLogo from '@/components/brand/BrandLogo';

export default function PublicFooter() {
  return (
    <footer className="bg-[#121113] text-white pt-20 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 pb-16 border-b border-white/10">
          {/* Brand Manifesto */}
          <div className="md:col-span-5 space-y-5">
            <BrandLogo variant="light" size="lg" />
            
            <p className="font-body text-sm text-neutral-400 leading-relaxed max-w-sm font-normal">
              Curated open-trip travel club untuk solo traveler, Gen Z, dan first-jobber. Berangkat bersama orang baru, pulang membawa sahabat seumur hidup.
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-display text-xs font-bold tracking-widest uppercase text-white/50">
              Eksplorasi
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-300 font-medium">
              <li>
                <Link href="/trips" className="hover:text-white transition-colors">
                  Upcoming Trips (2026)
                </Link>
              </li>
              <li>
                <Link href="/adventures" className="hover:text-white transition-colors">
                  Trip Stories & Documentation
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  The Club Manifesto
                </Link>
              </li>
              <li>
                <Link href="/trips/japan-autumn/batch-01-nov-2026" className="text-[#FD562A] hover:underline flex items-center gap-1">
                  <span>Japan Autumn 2026</span>
                  <ArrowUpRight size={14} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Transparency */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-display text-xs font-bold tracking-widest uppercase text-white/50">
              Kontak & Komunitas
            </h4>
            <div className="space-y-3 text-sm text-neutral-300 font-medium">
              <a
                href={`https://wa.me/${OFFICIAL_WA_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-[#D4FF00] transition-colors"
              >
                <WhatsappLogo size={20} weight="fill" className="text-[#D4FF00]" />
                <span className="font-mono">+62 857-7499-9875</span>
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://instagram.com/vacaywithstrangers"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 hover:text-[#D4FF00] transition-colors"
              >
                <InstagramLogo size={20} weight="fill" className="text-[#FD562A]" />
                <span>@vacaywithstrangers</span>
                <ArrowUpRight size={14} />
              </a>
            </div>

            <div className="pt-4 flex items-center gap-4 text-xs text-neutral-500 font-medium">
              <Link href="/terms" className="hover:text-white transition-colors">
                Syarat & Ketentuan
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/studio/login" className="hover:text-neutral-400 text-neutral-600 transition-colors">
                Staff Login
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium">
          <p>
            © {new Date().getFullYear()} Vacay With Strangers. Curated Travel Experiences.
          </p>
          <div className="flex items-center gap-1.5 text-neutral-400">
            <span>Crafted with</span>
            <Heart size={14} weight="fill" className="text-[#FD562A]" />
            <span>for curious travelers worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
