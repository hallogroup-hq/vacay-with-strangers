import Image from 'next/image';
import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';
import { getPublicAdventures } from '@/lib/db/queries';
import { Sparkle, CalendarBlank, Quotes, MapPin } from '@phosphor-icons/react/dist/ssr';

export const revalidate = 60;

export default async function AdventuresPage() {
  const stories = await getPublicAdventures();

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
                <span>The Strangers Archive</span>
              </span>

              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#121113] tracking-tight leading-tight">
                Dokumentasi & Cerita Nyata
              </h1>

              <p className="font-body text-base sm:text-lg text-[#64748B] leading-relaxed">
                Kumpulan momen autentik dari trip yang telah selesai diselenggarakan bersama para traveler yang sebelumnya belum pernah saling mengenal.
              </p>
            </div>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {stories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stories.map((story, idx) => (
                  <div
                    key={story.id}
                    className={`polaroid-card relative transition-transform duration-300 hover:rotate-0 hover:scale-102 ${
                      idx % 3 === 0 ? '-rotate-1' : idx % 3 === 1 ? 'rotate-1' : '-rotate-2'
                    }`}
                  >
                    <div className="polaroid-tape" />
                    
                    <div className="relative aspect-[16/11] rounded overflow-hidden mb-4">
                      <Image
                        src={story.hero_image_url || '/images/autumn-hero.jpg'}
                        alt={story.headline}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] font-bold">
                        <span className="flex items-center gap-1 text-[#FD562A]">
                          <CalendarBlank size={14} weight="bold" />
                          <span>{story.batch_code}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#4E38FF]">
                          <MapPin size={14} weight="bold" />
                          <span>{story.destination_name}</span>
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-lg text-[#121113] leading-snug">
                        {story.headline}
                      </h3>

                      <p className="font-body text-xs sm:text-sm text-[#64748B] leading-relaxed italic">
                        &ldquo;{story.story_text}&rdquo;
                      </p>

                      <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs font-bold">
                        <span className="text-[#121113]">{story.credited_name}</span>
                        <span className="text-[10px] text-[#64748B] uppercase">Verified Stranger</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl p-10 space-y-3 border border-black/5 shadow-xs">
                <h3 className="font-display font-bold text-xl text-[#121113]">
                  Dokumentasi Sedang Diproses
                </h3>
                <p className="font-body text-xs sm:text-sm text-[#64748B] max-w-md mx-auto">
                  Dokumentasi perjalanan batch sebelumnya sedang dalam proses kurasi bersama peserta.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <PublicFooter />
    </>
  );
}
