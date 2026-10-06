// Serves /ads.txt for Google AdSense. ads.txt needs the bare numeric publisher ID,
// so the "ca-pub-" prefix is stripped.
import { ADSENSE_CLIENT } from '@/lib/adsense';

export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const pubId = ADSENSE_CLIENT.replace(/^ca-pub-/, '');
  return new Response(`google.com, pub-${pubId}, DIRECT, f08c47fec0942fa0\n`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
