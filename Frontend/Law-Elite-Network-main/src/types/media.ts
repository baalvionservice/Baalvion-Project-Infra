/** Shared by Person and EntertainmentEntity — one video/interview/photo shape, not a type per entity kind. */
export interface MediaItem {
  title: string;
  url: string;
  thumbnailUrl?: string;
  source?: string;
  publishedAt?: string;
  durationSeconds?: number;
}

/** One episode of a podcast. Playback happens on the host's own player: we link out rather than hosting or embedding audio. */
export interface PodcastEpisode {
  title: string;
  /** Page for the episode on its host (Spotify, Apple Podcasts, the show's site). */
  url: string;
  description?: string;
  publishedAt?: string;
  durationSeconds?: number;
}

export interface Podcast {
  slug: string;
  title: string;
  description: string;
  host?: string;
  coverUrl?: string;
  /** Slug of a Person this show is about or hosted by, when a profile exists. */
  personSlug?: string;
  episodes: PodcastEpisode[];
}

/** A curated photo set. Person `photos` also surface as galleries without needing an entry here. */
export interface PhotoGallery {
  slug: string;
  title: string;
  description?: string;
  photos: MediaItem[];
  personSlug?: string;
}
