import Link from 'next/link';
import Image from 'next/image';
import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';
import InteractiveHero from '@/components/public/InteractiveHero';
import DestinationsShowcase from '@/components/public/DestinationsShowcase';
import TravelClubPremise from '@/components/public/TravelClubPremise';
import ExploreTripsCatalog from '@/components/public/ExploreTripsCatalog';
import HomeBottomCTA from '@/components/public/HomeBottomCTA';
import {
  getPublicBatches,
  getPublicDestinations,
  getPublicAdventures,
} from '@/lib/db/queries';
import { getPageConfig, PageSection } from '@/lib/cms/pageBuilderDefaults';
import { ArrowRight, Question, Sparkle } from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [allBatches, destinations, dbStories, homeConfig] = await Promise.all([
    getPublicBatches(),
    getPublicDestinations(),
    getPublicAdventures(),
    getPageConfig('home'),
  ]);

  const defaultStoryImages = [
    '/images/stories/story-group.jpg',
    '/images/stories/story-mountain.jpg',
    '/images/stories/story-road.jpg',
  ];

  const visibleSections = (homeConfig.sections || []).filter((s) => s.isVisible !== false);

  const renderSection = (section: PageSection) => {
    switch (section.type) {
      case 'hero':
        return <InteractiveHero key={section.id} config={section} />;

      case 'destinations':
        return <DestinationsShowcase key={section.id} config={section} />;

      case 'premise':
        return <TravelClubPremise key={section.id} config={section} />;

      case 'trips_catalog':
        return <ExploreTripsCatalog key={section.id} batches={allBatches} config={section} />;

      case 'stories': {
        const hasCustomItems = section.items && section.items.length > 0;
        const displayStories = hasCustomItems
          ? section.items!.slice(0, 3)
          : dbStories.slice(0, 3).map((st, i) => ({
              id: st.story_id,
              title: st.title,
              description: st.traveler_quote || 'Berangkat sendirian, pulang bawa circle nongkrong baru.',
              author: `${st.traveler_name}, ${st.traveler_origin || 'Jakarta'}`,
              imageUrl: defaultStoryImages[i % defaultStoryImages.length],
            }));

        return (
          <section key={section.id} className="py-20 lg:py-28 bg-white border-b border-black/5" id="stories">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="max-w-2xl text-center mx-auto space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4E38FF]">
                  {section.badge || 'Dokumentasi Asli'}
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight leading-tight">
                  {section.title || 'Momen Nyata Bersama Sahabat Baru'}
                </h2>
                <p className="font-body text-base text-[#64748B]">
                  {section.description || 'Tanpa skrip, tanpa model bayaran. Ini cerita asli dari solo traveler yang memberanikan diri melangkah sendirian.'}
                </p>
              </div>

              {/* Tactile Polaroid Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
                {displayStories.map((story, idx) => (
                  <div
                    key={story.id || idx}
                    className={`polaroid-card relative transition-transform duration-300 hover:rotate-0 hover:scale-102 ${
                      idx === 0 ? '-rotate-2' : idx === 1 ? 'rotate-2' : '-rotate-1'
                    }`}
                  >
                    <div className="polaroid-tape" />
                    <div className="relative aspect-[4/3] rounded overflow-hidden bg-neutral-900">
                      <Image
                        src={story.imageUrl || defaultStoryImages[idx % defaultStoryImages.length]}
                        alt={story.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    </div>
                    <div className="pt-5 space-y-2 text-center">
                      <h4 className="font-display font-extrabold text-base text-[#121113]">
                        &quot;{story.title}&quot;
                      </h4>
                      <p className="font-body text-xs text-[#64748B] italic leading-relaxed">
                        {story.description || 'Berangkat sendirian, pulang bawa circle nongkrong baru.'}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FD562A] block pt-1">
                        {story.author || 'Solo Traveler'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center pt-4">
                <Link
                  href="/adventures"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white border border-black/10 text-xs font-bold uppercase tracking-wider text-[#121113] hover:bg-neutral-50 shadow-xs transition-all group"
                >
                  <span>Lihat Seluruh Cerita Petualangan</span>
                  <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case 'bottom_cta':
        return <HomeBottomCTA key={section.id} config={section} />;

      case 'faq':
        return (
          <section key={section.id} className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-black/5" id="faq">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="text-center space-y-3">
                <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#FD562A]">
                  {section.badge || 'TANYA JAWAB'}
                </div>
                <h2 className="font-display font-black text-3xl sm:text-4xl text-[#121113] tracking-tight">
                  {section.title || 'Frequently Asked Questions'}
                </h2>
                {section.description && (
                  <p className="font-body text-base text-[#64748B] max-w-xl mx-auto">
                    {section.description}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {(section.items || []).map((faqItem, idx) => (
                  <div
                    key={faqItem.id || idx}
                    className="p-6 rounded-2xl bg-white border border-black/5 shadow-xs space-y-2"
                  >
                    <h3 className="font-display font-bold text-base text-[#121113] flex items-center gap-2">
                      <Question size={18} weight="bold" className="text-[#4E38FF] shrink-0" />
                      <span>{faqItem.title}</span>
                    </h3>
                    <p className="font-body text-sm text-[#64748B] leading-relaxed pl-6">
                      {faqItem.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'text_image':
        return (
          <section key={section.id} className="py-20 lg:py-28 bg-white border-b border-black/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 space-y-6">
                  {section.badge && (
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-[#4E38FF]">
                      {section.badge}
                    </div>
                  )}
                  <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-[#121113] tracking-tight leading-tight">
                    {section.title}
                  </h2>
                  <p className="font-body text-base text-[#64748B] leading-relaxed">
                    {section.description}
                  </p>
                  {section.primaryCtaText && (
                    <Link
                      href={section.primaryCtaUrl || '#'}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#121113] text-white font-display font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                    >
                      <span>{section.primaryCtaText}</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  )}
                </div>
                <div className="lg:col-span-6">
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-neutral-900 border border-black/10 shadow-lg">
                    <Image
                      src={section.imageUrl || '/images/autumn-hero.jpg'}
                      alt={section.title || 'Visual'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 600px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <PublicHeader />

      <main className="flex-1 flex flex-col bg-[#FAF8F5]">
        {visibleSections.map((section) => renderSection(section))}
      </main>

      <PublicFooter />
    </>
  );
}
