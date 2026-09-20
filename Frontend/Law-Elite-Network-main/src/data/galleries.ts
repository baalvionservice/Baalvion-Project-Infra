import type { PhotoGallery } from '@/types/media';

/**
 * Curated galleries, for photo sets that are not simply one person's photos
 * (those are picked up from Person.photos automatically). Only images we have
 * the right to show, each with a source credit.
 */
export const PHOTO_GALLERIES: PhotoGallery[] = [];
