import type { Metadata } from 'next';
import { MediaDirectory } from '@/components/home/MediaDirectory';
import { getAllMedia } from '@/lib/media-server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const items = await getAllMedia('interview');
  return {
    title: 'Interviews',
    description: 'Interviews curated by Law Elite Network alongside our legal guides and news coverage.',
    alternates: { canonical: `${SITE}/interviews` },
    // No thin pages: stay out of the index until there is something to list.
    robots: { index: items.length > 0, follow: true },
  };
}

export default async function Page() {
  return <MediaDirectory kind="interview" items={await getAllMedia('interview')} />;
}
