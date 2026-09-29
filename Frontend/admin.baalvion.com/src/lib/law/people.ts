import { serviceClients } from '@/lib/api/client';

/** Mirrors law-service utils/peopleValidation.js and the site's PERSON_CATEGORIES. */
export const PERSON_CATEGORIES = [
  ['actors', 'Actors'], ['musicians', 'Musicians'], ['directors', 'Directors'], ['producers', 'Producers'],
  ['tv-personalities', 'TV personalities'], ['influencers', 'Influencers'], ['creators', 'Creators'],
  ['athletes', 'Athletes'], ['lawyers', 'Lawyers'], ['judges', 'Judges'], ['other', 'Other public figures'],
] as const;

export const PERSON_STATUSES = ['active', 'retired', 'inactive', 'deceased'] as const;

export const LINK_KINDS = [
  ['topic', 'Topic'], ['article', 'Article'], ['person', 'Person'], ['entertainment', 'Movie / show / music'],
  ['legal-case', 'Legal case'], ['court', 'Court'], ['sports-team', 'Sports team'],
  ['sports-competition', 'Competition'], ['country', 'Country (ISO code)'],
] as const;

/** Licences the site may display. NC/ND are refused server-side too. */
export const PHOTO_LICENSES = ['Public domain', 'CC0', 'CC BY 4.0', 'CC BY-SA 4.0', 'CC BY 3.0', 'CC BY-SA 3.0', 'LEN-owned', 'Licensed'] as const;

export interface PersonRecord {
  id: number;
  slug: string;
  full_name: string;
  display_name?: string | null;
  category: string;
  country_code?: string | null;
  status: string;
  birth_date?: string | null;
  birth_place?: string | null;
  death_date?: string | null;
  short_bio?: string | null;
  biography?: string | null;
  career: Record<string, unknown>[];
  education: Record<string, unknown>[];
  awards: Record<string, unknown>[];
  timeline: Record<string, unknown>[];
  sources: Record<string, unknown>[];
  social: Record<string, string>;
  sports_info?: Record<string, unknown>;
  official_website?: string | null;
  wikidata_id?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  verified: boolean;
  source_note?: string | null;
  published: boolean;
  indexable: boolean;
  featured?: boolean;
  archived: boolean;
  updated_at?: string;
}

export interface PhotoRecord {
  id: number;
  person_id: number;
  alt_text?: string | null;
  credit: string;
  license: string;
  license_url?: string | null;
  source_url?: string | null;
  is_primary: boolean;
  is_active: boolean;
}

export interface LinkRecord {
  id: number;
  person_id: number;
  kind: string;
  target_slug: string;
  relationship?: string | null;
}

// law-service wraps rows as { data: { items } } for lists and { data: row } for single reads.
export const rowsOf = <T,>(d: unknown): T[] => {
  const x = (d as { data?: { items?: T[] } | T[] })?.data;
  return Array.isArray(x) ? x : ((x as { items?: T[] })?.items ?? []);
};
export const rowOf = <T,>(d: unknown): T => (d as { data: T }).data;

export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’'.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const law = serviceClients.law;

export const peopleApi = {
  list: (params: Record<string, unknown>) => law.get('/admin/people', { params }).then((r) => r.data),
  get: (id: number | string) => law.get(`/admin/people/${id}`).then((r) => rowOf<PersonRecord>(r.data)),
  create: (body: Partial<PersonRecord>) => law.post('/admin/people', body).then((r) => rowOf<PersonRecord>(r.data)),
  update: (id: number, body: Partial<PersonRecord>) => law.patch(`/admin/people/${id}`, body).then((r) => rowOf<PersonRecord>(r.data)),

  photos: (personId: number) => law.get('/admin/person_photos', { params: { person_id: personId, limit: 100 } }).then((r) => rowsOf<PhotoRecord>(r.data)),
  updatePhoto: (id: number, body: Partial<PhotoRecord>) => law.patch(`/admin/person_photos/${id}`, body).then((r) => r.data),
  uploadPhoto: (personId: number, form: FormData) =>
    // Let the browser set the multipart boundary.
    law.post(`/admin/people/${personId}/photos`, form, { headers: { 'Content-Type': undefined }, timeout: 60_000 }).then((r) => r.data),
  photoBlob: (id: number) => law.get(`/admin/people/photos/${id}`, { responseType: 'blob' }).then((r) => r.data as Blob),

  links: (personId: number) => law.get('/admin/person_links', { params: { person_id: personId, limit: 200 } }).then((r) => rowsOf<LinkRecord>(r.data)),
  addLink: (body: Omit<LinkRecord, 'id'>) => law.post('/admin/person_links', body).then((r) => r.data),
  removeLink: (id: number) => law.delete(`/admin/person_links/${id}`).then((r) => r.data),
};
