import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://connect.baalvion.com";

  // Static routes that are always indexable
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/campaigns`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // TODO: Add dynamic routes for campaigns and creators when database integration is complete
  // Example:
  // const campaigns = await db.campaigns.findAll();
  // const campaignRoutes = campaigns.map(campaign => ({
  //   url: `${baseUrl}/campaigns/${campaign.id}`,
  //   lastModified: new Date(campaign.updatedAt),
  //   changeFrequency: 'weekly',
  //   priority: 0.7,
  // }));

  return staticRoutes;
}
