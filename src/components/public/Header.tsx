'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { List, X, WhatsappLogo, Compass, Sparkle, Users } from '@phosphor-icons/react';
import { OFFICIAL_WA_NUMBER } from '@/lib/whatsapp/generator';
import BrandLogo from '@/components/brand/BrandLogo';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/trips', label: 'Explore Trips', icon: Compass },
    { href: '/adventures', label: 'Adventures', icon: Sparkle },
    { href: '/about', label: 'About Club', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-black/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <BrandLogo variant="color" size="md" />

        {/* Center Pill Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-full border border-black/5 shadow-xs">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-[#121113] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#121113] hover:bg-black/5'
                }`}
              >
                <Icon size={16} weight={isActive ? 'fill' : 'bold'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & WhatsApp CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/trips"
            className="text-xs font-bold uppercase tracking-wider text-[#121113] hover:text-[#4E38FF] px-3 py-2 transition-colors"
          >
            Autumn 2026
          </Link>

          <a
            href={`https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent('Halo Vacay With Strangers! Aku mau tanya tentang trip dan jadwal yang tersedia ya.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FD562A] hover:bg-[#4E38FF] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <WhatsappLogo size={18} weight="fill" />
            <span>Tanya Admin</span>
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-black/10 text-[#121113] shadow-xs active:scale-95 transition-all"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-black/5 bg-[#FAF8F5] px-4 pt-3 pb-6 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-[#121113] text-white'
                    : 'bg-white text-[#121113] border border-black/5'
                }`}
              >
                <Icon size={20} weight="bold" className={isActive ? 'text-white' : 'text-[#4E38FF]'} />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2">
            <a
              href={`https://wa.me/${OFFICIAL_WA_NUMBER}?text=${encodeURIComponent('Halo Vacay With Strangers! Aku mau tanya tentang trip ya.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#FD562A] text-white text-sm font-bold shadow-sm"
            >
              <WhatsappLogo size={20} weight="fill" />
              <span>Chat WhatsApp Resmi</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
