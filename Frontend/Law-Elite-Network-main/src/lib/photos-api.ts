import { fetchPublicApi } from '@/lib/api/public-fetch';

export interface EntityPhotoInfo {
  /** Same-origin URL (/media/photos/{id}), served from LEN's own storage. */
  url: string;
  alt: string;
  credit: string;
  license: string;
  licenseUrl?: string;
  sourceUrl?: string;
}

type EntityKind = 'person' | 'entertainment' | 'legal-case' | 'court' | 'sports-team' | 'sports-competition' | 'podcast';

interface ApiPhoto {
  id: number; entity_type: EntityKind; entity_slug: string; alt_text?: string | null;
  credit: string; license: string; license_url?: string | null; source_url?: string | null;
}

/**
 * The primary photo of every entity that has one, keyed "type:slug". Photos are
 * attached by slug, so a built-in person or film gets its picture without
 * being copied into the admin tables. Empty when law-service is unreachable:
 * pages then show their placeholder, never a broken image.
 */
export async function fetchEntityPhotos(): Promise<Map<string, EntityPhotoInfo>> {
  const json = await fetchPublicApi('/photos');
  const rows = Array.isArray(json?.data) ? (json.data as ApiPhoto[]) : [];
  return new Map(
    rows.map((r) => [
      `${r.entity_type}:${r.entity_slug}`,
      {
        url: `/media/photos/${r.id}`,
        alt: r.alt_text || r.entity_slug,
        credit: r.credit,
        license: r.license,
        licenseUrl: r.license_url ?? undefined,
        sourceUrl: r.source_url ?? undefined,
      },
    ]),
  );
}

/** Every active photo of one entity, main image first. Empty when law-service is unreachable. */
export async function fetchPhotosFor(type: EntityKind, slug: string): Promise<EntityPhotoInfo[]> {
  const json = await fetchPublicApi(`/photos/entity/${type}/${slug}`);
  const rows = Array.isArray(json?.data) ? (json.data as ApiPhoto[]) : [];
  return rows.map((r) => ({
    url: `/media/photos/${r.id}`, alt: r.alt_text || r.entity_slug, credit: r.credit, license: r.license,
    licenseUrl: r.license_url ?? undefined, sourceUrl: r.source_url ?? undefined,
  }));
}
