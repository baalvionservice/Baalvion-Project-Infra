import { articleArtDataUri, personSilhouetteDataUri } from '@baalvion/illustrations';

/**
 * Resolves an article's real featured image (from the CMS, law-service, or bundled
 * data — whatever field a given source uses) and only falls back to original,
 * deterministically-generated artwork when none is set. Never falls back to a
 * stock/placeholder image.
 */
export function resolveArticleImage(article: {
  featuredImage?: string | null;
  cover_image?: string | null;
  image_url?: string | null;
  title?: string | null;
  category?: { name?: string } | null;
  subcategory?: { name?: string } | null;
  id?: string | number | null;
  slug?: string | null;
  imageSeed?: string | null;
} | null | undefined): string {
  const real = article?.featuredImage || article?.cover_image || article?.image_url;
  if (real) return real;

  const seed = String(article?.imageSeed || article?.id || article?.slug || 'law-elite-network');
  return articleArtDataUri({
    title: article?.title || 'Law Elite Network',
    category: article?.category?.name || article?.subcategory?.name || 'Law',
    seed,
  });
}

/** Resolves a person's real avatar/profile photo, falling back to an abstract silhouette. */
export function resolvePersonImage(person: {
  avatarUrl?: string | null;
  profileImage?: string | null;
  avatar?: string | null;
  name?: string | null;
  id?: string | number | null;
  avatarSeed?: string | null;
} | null | undefined): string {
  const real = person?.avatarUrl || person?.profileImage || person?.avatar;
  if (real) return real;

  const seed = String(person?.avatarSeed || person?.id || person?.name || 'law-elite-network');
  return personSilhouetteDataUri({ name: person?.name || 'Law Elite Network', seed });
}
