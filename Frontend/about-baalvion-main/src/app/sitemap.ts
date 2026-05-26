
import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const BASE_URL = 'https://about.baalvion.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = db.pages.getAll();
  const projects = db.projects.getAll();
  const articles = db.articles.getAll();
  const updates = db.operationalUpdates.getAll();

  const staticRoutes: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${BASE_URL}/${page.slug === 'home' ? '' : page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page.slug === 'home' ? 1 : 0.8,
  }));

  const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
    url: `${BASE_URL}/projects/${project.id}`,
    lastModified: new Date(project.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/news/${article.category}/${article.slug}`,
    lastModified: new Date(), // articles don't have updatedAt currently
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const updateRoutes: MetadataRoute.Sitemap = updates.map((update) => ({
    url: `${BASE_URL}/updates`, // links to general updates page
    lastModified: new Date(update.updatedAt),
    changeFrequency: 'daily',
    priority: 0.5,
  }));

  return [
    ...staticRoutes,
    ...projectRoutes,
    ...articleRoutes,
    ...updateRoutes,
    {
      url: `${BASE_URL}/company`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    }
  ];
}
