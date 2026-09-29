import type { Project, EcosystemItem } from './db';
import {
  cmsGetPage,
  cmsGetProjects,
  cmsGetProject,
  cmsGetEcosystem,
  type PopulatedPage,
} from './cms';

/**
 * Server-side data fetching utilities for SSR pages.
 *
 * These now read from the live Baalvion CMS (cms-service) via `@/lib/cms`
 * instead of the former in-memory mock. Content is managed centrally in the
 * admin-platform console.
 */
export type { PopulatedPage };

/** Home page with populated page-builder sections. */
export async function getHomePageData(): Promise<PopulatedPage | null> {
  return cmsGetPage('home');
}

/** All projects for server-side rendering. */
export async function getProjects(): Promise<Project[]> {
  return cmsGetProjects();
}

/** Ecosystem layers for server-side rendering. */
export async function getEcosystemItems(): Promise<EcosystemItem[]> {
  return cmsGetEcosystem();
}

/** A single project by slug (used as the route id). */
export async function getProjectById(id: string): Promise<Project | null> {
  return cmsGetProject(id);
}

/** A page by slug with populated sections. */
export async function getPageBySlug(slug: string): Promise<PopulatedPage | null> {
  return cmsGetPage(slug);
}
