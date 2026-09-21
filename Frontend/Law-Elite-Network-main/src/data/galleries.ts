import type { PhotoGallery } from '@/types/media';

/**
 * Curated photo galleries for Page Six court cameras & red carpet media.
 * Photos are MediaItem shapes: { title, url, thumbnailUrl?, source?, publishedAt? }
 */
export const PHOTO_GALLERIES: PhotoGallery[] = [
  {
    slug: 'courthouse-cameras-high-profile-trials-2026',
    title: 'Courthouse Cameras: Inside High-Profile Trials of 2026',
    description:
      'Exclusive legal photography from federal and state court proceedings across Manhattan, Washington D.C., and Los Angeles.',
    photos: [
      {
        title: 'Supreme Court of the United States plaza — emergency stay ruling',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
        source: 'Law Elite Photo Desk',
        publishedAt: 'September 18, 2026',
      },
      {
        title: 'Lead defense counsel entering federal courthouse, Manhattan',
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
        source: 'Page Six Court Cam',
        publishedAt: 'September 18, 2026',
      },
      {
        title: 'Delaware Court of Chancery — corporate governance trial session',
        url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
        source: 'Chancery Press Pool',
        publishedAt: 'September 17, 2026',
      },
    ],
  },
  {
    slug: 'page-six-spotted-celebrity-legal-desk',
    title: 'Page Six Spotted: Red Carpet & Legal Desk Sightings',
    description:
      'Celebrities, entertainment attorneys, and public figures captured at major industry press events and courthouse appearances.',
    photos: [
      {
        title: 'Entertainment law summit panel in Los Angeles',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
        source: 'Page Six Wire',
        publishedAt: 'September 19, 2026',
      },
      {
        title: 'Sports arbitration proceedings — CAS Lausanne',
        url: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1541534401786-2077eed87a74?auto=format&fit=crop&w=600&q=80',
        source: 'CAS Media Office',
        publishedAt: 'September 16, 2026',
      },
    ],
  },
];
