import type { Metadata } from 'next';
import { MediaDirectory } from '@/components/home/MediaDirectory';
import { VideoHubView } from '@/components/videos/VideoHubView';
import { getAllMedia } from '@/lib/media-server';
import { getVideoHub } from '@/lib/videos-hub';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

export const revalidate = 900;

export async function generateMetadata(): Promise<Metadata> {
  const [hub, attached] = await Promise.all([getVideoHub(), getAllMedia('video')]);
  return {
    title: 'Video',
    description: 'Shows, interviews and clips from Law Elite Network: national and international coverage of the people, entertainment, sports and legal figures we profile.',
    alternates: { canonical: `${SITE}/videos` },
    // No thin pages: stay out of the index until there is something to list.
    robots: { index: hub.videos.length + attached.length > 0, follow: true },
  };
}

export default async function Page() {
  const hub = await getVideoHub();
  // Until any hub video is published, keep showing clips attached to profiles.
  if (hub.videos.length === 0) return <MediaDirectory kind="video" items={await getAllMedia('video')} />;
  return <VideoHubView hub={hub} />;
}
