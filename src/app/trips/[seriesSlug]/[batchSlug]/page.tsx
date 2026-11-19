import { notFound } from 'next/navigation';
import PublicHeader from '@/components/public/Header';
import PublicFooter from '@/components/public/Footer';
import BatchDetailInteractive from '@/components/public/BatchDetailInteractive';
import { getPublicBatchBySlugs } from '@/lib/db/queries';

interface BatchDetailPageProps {
  params: Promise<{
    seriesSlug: string;
    batchSlug: string;
  }>;
}

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage(props: BatchDetailPageProps) {
  const params = await props.params;
  const { seriesSlug, batchSlug } = params;

  const batch = await getPublicBatchBySlugs(seriesSlug, batchSlug);

  if (!batch) {
    notFound();
  }

  return (
    <>
      <PublicHeader />
      <main className="flex-1 bg-white">
        <BatchDetailInteractive batch={batch} />
      </main>
      <PublicFooter />
    </>
  );
}
