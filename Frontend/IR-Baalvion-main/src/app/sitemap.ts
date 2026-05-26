import { AppConfig } from "@/config";
import { MetadataRoute } from "next";
import { pageService } from "@/core/services/page.service";
import { boardMaterialsService } from "@/core/services/board-materials.service";
import { navigationService } from "@/core/services/navigation.service";
import { contentService } from "@/core/services/content.service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = AppConfig.baseUrl;
  const currentDate = new Date();

  // Main public routes
  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/capital-ops`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/data-room`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/performance`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/onboarding`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Governance section routes
  const governanceRoutes = [
    {
      url: `${baseUrl}/governance`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/governance/overview`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/governance/board-of-directors`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/governance/committee-composition`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/governance/leadership`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/governance/my-voting`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ];

  // News and Events section routes
  const newsEventsRoutes = [
    {
      url: `${baseUrl}/news-and-events`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news-and-events/news`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news-and-events/press-releases`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news-and-events/events`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news-and-events/investor-day`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/news-and-events/webcast`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ];

  // Resources section routes
  const resourcesRoutes = [
    {
      url: `${baseUrl}/resources`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources/contact-ir`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/resources/email-alerts`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Phase routes (if publicly accessible)
  const phaseRoutes = [
    {
      url: `${baseUrl}/phase2`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/phase2/dashboard`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/phase2/data-room`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/phase3`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/phase3/dashboard`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    },
  ];

  // Dynamic content from services
  let dynamicRoutes: MetadataRoute.Sitemap = [];

  try {
    // Get dynamic pages from page service
    const pagesResponse = await pageService.getAllPages();
    if (pagesResponse.success && pagesResponse.data) {
      const publishedPages = pagesResponse.data.filter(
        (page) =>
          page.status === "Published" && page.workflowStatus === "Published"
      );

      const pageRoutes = publishedPages.map((page) => ({
        url: `${baseUrl}${page.slug === "/" ? "" : page.slug}`,
        lastModified:
          page.versionHistory.length > 0
            ? new Date(
                page.versionHistory[page.versionHistory.length - 1].timestamp
              )
            : currentDate,
        changeFrequency: "weekly" as const,
        priority: page.slug === "/" ? 1.0 : 0.7,
      }));

      dynamicRoutes.push(...pageRoutes);
    }

    // Get navigation items for additional routes
    const navigationResponse = await navigationService.getNavigation();
    if (navigationResponse.success && navigationResponse.data) {
      const extractNavigationUrls = (items: any[]): string[] => {
        const urls: string[] = [];
        items.forEach((item) => {
          if (
            item.href &&
            item.href !== "#" &&
            !item.href.startsWith("/#") &&
            item.isActive
          ) {
            urls.push(item.href);
          }
          if (item.children) {
            urls.push(...extractNavigationUrls(item.children));
          }
        });
        return urls;
      };

      const navUrls = extractNavigationUrls(navigationResponse.data);
      const uniqueNavUrls = [...new Set(navUrls)];

      const navRoutes = uniqueNavUrls.map((href) => ({
        url: `${baseUrl}${href}`,
        lastModified: currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));

      dynamicRoutes.push(...navRoutes);
    }

    // Get board materials for governance content
    const boardMaterials = await boardMaterialsService.getMaterials();
    const publishedMaterials = boardMaterials.filter(
      (material) => material.workflowStatus === "Published"
    );

    const materialRoutes = publishedMaterials.map((material) => ({
      url: `${baseUrl}/governance/board-materials/${material.id}`,
      lastModified:
        material.versionHistory.length > 0
          ? new Date(
              material.versionHistory[
                material.versionHistory.length - 1
              ].timestamp
            )
          : currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

    dynamicRoutes.push(...materialRoutes);

    // Get dynamic content from content service
    const contentData = await contentService.getAllContentForSitemap();

    // Add news articles to sitemap
    const newsRoutes = contentData.news.map((article) => ({
      url: `${baseUrl}/news-and-events/${
        article.category === "press-release" ? "press-releases" : "news"
      }/${article.slug}`,
      lastModified: new Date(article.lastModified),
      changeFrequency: "monthly" as const,
      priority: article.priority || 0.7,
    }));

    dynamicRoutes.push(...newsRoutes);

    // Add investor documents to sitemap
    const documentRoutes = contentData.documents.map((doc) => {
      let basePath = "/data-room";
      switch (doc.type) {
        case "annual-report":
          basePath += "/annual-reports";
          break;
        case "quarterly-report":
          basePath += "/quarterly-reports";
          break;
        case "presentation":
          basePath += "/investor-presentations";
          break;
        case "filing":
          basePath += "/sec-filings";
          break;
        default:
          basePath += "/documents";
      }

      return {
        url: `${baseUrl}${basePath}/${doc.slug}`,
        lastModified: new Date(doc.lastModified),
        changeFrequency:
          doc.type === "annual-report"
            ? ("yearly" as const)
            : ("monthly" as const),
        priority: doc.type === "annual-report" ? 0.9 : 0.8,
      };
    });

    dynamicRoutes.push(...documentRoutes);
  } catch (error) {
    console.warn("Error fetching dynamic content for sitemap:", error);
    // Continue with static routes if dynamic content fails
  }

  // Sample governance documents (you can replace with actual governance service)
  const sampleGovernanceRoutes = [
    {
      url: `${baseUrl}/governance/policies/code-of-conduct`,
      lastModified: new Date("2025-12-01"),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/governance/policies/whistleblower-policy`,
      lastModified: new Date("2025-11-15"),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/governance/audit-reports/2025-annual-audit`,
      lastModified: new Date("2026-02-01"),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    },
  ];

  // Combine all routes and remove duplicates
  const allRoutes = [
    ...staticRoutes,
    ...governanceRoutes,
    ...newsEventsRoutes,
    ...resourcesRoutes,
    ...phaseRoutes,
    ...dynamicRoutes,
    ...sampleGovernanceRoutes,
  ];

  // Remove duplicates by URL and sort by priority
  const uniqueRoutes = allRoutes.filter(
    (route, index, self) => index === self.findIndex((r) => r.url === route.url)
  );

  return uniqueRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
