import { db, Project, EcosystemItem, Page } from "./db";

/**
 * Server-side data fetching utilities for SSR pages
 * These functions run on the server and provide data for static generation
 */

export interface PopulatedPage extends Page {
  sectionData: any[];
}

/**
 * Fetch home page data with populated sections
 */
export async function getHomePageData(): Promise<PopulatedPage | null> {
  try {
    const page = db.pages.getBySlug("home", true);
    return page as PopulatedPage;
  } catch (error) {
    console.error("Error fetching home page data:", error);
    return null;
  }
}

/**
 * Fetch all projects for server-side rendering
 */
export async function getProjects(): Promise<Project[]> {
  try {
    return db.projects.getAll();
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

/**
 * Fetch ecosystem items for server-side rendering
 */
export async function getEcosystemItems(): Promise<EcosystemItem[]> {
  try {
    return db.ecosystem.getAll();
  } catch (error) {
    console.error("Error fetching ecosystem items:", error);
    return [];
  }
}

/**
 * Fetch project by ID for server-side rendering
 */
export async function getProjectById(id: string): Promise<Project | null> {
  try {
    return db.projects.getById(id) || null;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    return null;
  }
}

/**
 * Fetch page data by slug with populated sections
 */
export async function getPageBySlug(
  slug: string
): Promise<PopulatedPage | null> {
  try {
    const page = db.pages.getBySlug(slug, true);
    return page as PopulatedPage;
  } catch (error) {
    console.error("Error fetching page by slug:", error);
    return null;
  }
}
