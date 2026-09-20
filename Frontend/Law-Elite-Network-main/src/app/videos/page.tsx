import type { Metadata } from 'next';
import { MediaDirectory } from '@/components/home/MediaDirectory';
import { getAllMedia } from '@/lib/media-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const items = await getAllMedia('video');
  return {
    title: 'Videos',
    description: 'Law Elite Network videos on the people, entertainment, sports and legal figures we profile.',
    alternates: { canonical: `${SITE}/videos` },
    // No thin pages: stay out of the index until there is something to list.
    robots: { index: items.length > 0, follow: true },
  };
}

export default async function Page() {
  return <MediaDirectory kind="video" items={await getAllMedia('video')} />;
}
