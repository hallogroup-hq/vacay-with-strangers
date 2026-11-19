import type { Metadata, Viewport } from 'next';
import { Sora, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sora',
  weight: ['400', '600', '700', '800'],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Vacay With Strangers — Curated Travel Club for Strangers & Solo Travelers',
  description: 'Open-trip travel club premium untuk solo traveler, Gen Z, & first-jobbers. Keliling Jepang & dunia dalam circle kecil (max 12 orang), itinerary autentik, dan skema cicilan resmi sampai H-30.',
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'Vacay With Strangers — Open Trip Travel Club',
    description: 'Berangkat sebagai orang asing, pulang membawa sahabat seumur hidup. Open-trip curated ke Jepang & destinasi dunia.',
    type: 'website',
    locale: 'id_ID',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${sora.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#121113] selection:bg-[#D4FF00] selection:text-[#121113]">
        {children}
      </body>
    </html>
  );
}
