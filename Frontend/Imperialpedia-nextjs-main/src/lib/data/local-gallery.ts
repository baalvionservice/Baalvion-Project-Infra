import fs from 'fs';
import path from 'path';

const GALLERY_DIR = path.join(process.cwd(), 'public', 'prompts', 'gallery');
const IMAGE_EXT = /\.(webp|jpe?g|png|gif|avif)$/i;

/** Reads whatever's dropped in public/prompts/gallery — add or remove a file there and both
 * the hero photo wall and the gallery strip pick it up on next request, no code change. */
export function getLocalGalleryPhotos(): string[] {
  try {
    return fs.readdirSync(GALLERY_DIR)
      .filter((f) => IMAGE_EXT.test(f))
      .sort((a, b) => {
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .map((f) => `/prompts/gallery/${f}`);
  } catch {
    return [];
  }
}
