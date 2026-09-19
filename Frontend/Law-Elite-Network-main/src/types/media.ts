/** Shared by Person and EntertainmentEntity — one video/interview/photo shape, not a type per entity kind. */
export interface MediaItem {
  title: string;
  url: string;
  thumbnailUrl?: string;
  source?: string;
  publishedAt?: string;
  durationSeconds?: number;
}
