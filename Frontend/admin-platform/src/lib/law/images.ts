import { serviceClients } from '@/lib/api/client';
import { PHOTO_LICENSES, rowsOf } from '@/lib/law/people';

export { PHOTO_LICENSES, rowsOf };

/** Mirrors ENTITY_TYPES in law-service service/entityPhotos.js. */
export const IMAGE_ENTITY_TYPES = [
  ['person', 'Person'], ['entertainment', 'Movie / show / music'], ['legal-case', 'Legal case'],
  ['court', 'Court'], ['sports-team', 'Sports team'], ['sports-competition', 'Competition'],
] as const;

export interface EntityPhotoRecord {
  id: number; entity_type: string; entity_slug: string; alt_text?: string | null; credit: string;
  license: string; license_url?: string | null; source_url?: string | null; is_primary: boolean; is_active: boolean; created_at?: string;
}

const law = serviceClients.law;

export const imagesApi = {
  list: (params: Record<string, unknown>) => law.get('/admin/entity_photos', { params }).then((r) => r.data),
  update: (id: number, body: Partial<EntityPhotoRecord>) => law.patch(`/admin/entity_photos/${id}`, body).then((r) => r.data),
  upload: (form: FormData) => law.post('/admin/entity-photos', form, { headers: { 'Content-Type': undefined }, timeout: 60_000 }).then((r) => r.data),
  blob: (id: number) => law.get(`/admin/entity-photos/${id}/blob`, { responseType: 'blob' }).then((r) => r.data as Blob),
};
