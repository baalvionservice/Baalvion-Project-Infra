import type { AllocationDocument } from '../../token/src/allocation.ts';
import { buildPages } from './pages.ts';
import { renderPage } from './render.ts';

export interface OutputFile {
  /** Path relative to the output directory. */
  readonly file: string;
  readonly html: string;
}

export function buildSite(doc: AllocationDocument): OutputFile[] {
  return buildPages(doc).map((page) => ({
    file: page.path === '/' ? 'index.html' : `${page.path.slice(1)}/index.html`,
    html: renderPage(page),
  }));
}
