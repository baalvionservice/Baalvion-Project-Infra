import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

/**
 * PWA manifest.
 *
 * Two decisions here look like omissions and are not.
 *
 * `display: 'browser'` — a standalone install puts a CanWeMarry icon on someone's home
 * screen and opens without an address bar, which is the wrong outcome for a person whose
 * family may pick up their phone. Installing stays possible; it just does not disguise
 * itself as a separate app, and the URL stays visible so the reader always knows where
 * they are.
 *
 * No service worker, and therefore no offline mode. Almost nothing here works without the
 * server — a case list, a discussion and a moderation queue are all live data — so an
 * offline shell would be a promise the product cannot keep. More importantly, a service
 * worker caches responses to disk, and a cache of somebody's case on a shared device is
 * exactly the disclosure this platform exists around.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    lang: 'en',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'browser',
    orientation: 'portrait-primary',
    background_color: '#fbfaf7',
    theme_color: '#fbfaf7',
    categories: ['social', 'lifestyle'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      // A maskable variant so a launcher that crops to its own shape does not clip the mark.
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
