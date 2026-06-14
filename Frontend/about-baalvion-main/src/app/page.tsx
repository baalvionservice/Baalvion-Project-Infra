import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import HomePageServer from "@/components/home-page-server";
import { HomeExplore } from "@/components/home-explore";
import {
  getHomePageData,
  getProjects,
  getEcosystemItems,
} from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Baalvion — Global Trade Infrastructure Platform",
  description:
    "Baalvion builds global trade infrastructure connecting businesses, finance, compliance, and intelligence into one unified platform.",
  alternates: { canonical: "https://about.baalvion.com" },
  openGraph: {
    title: "Baalvion — Global Trade Infrastructure Platform",
    description:
      "Baalvion builds global trade infrastructure connecting businesses, finance, compliance, and intelligence into one unified platform.",
    url: "https://about.baalvion.com",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://about.baalvion.com/api/og?title=Baalvion+Operating+System+(BOS)&eyebrow=Baalvion+Industries",
        width: 1200,
        height: 630,
        alt: "Baalvion Operating System (BOS) Home",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Baalvion — Global Trade Infrastructure Platform",
    description:
      "Baalvion builds global trade infrastructure connecting businesses, finance, compliance, and intelligence into one unified platform.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Operating+System+(BOS)&eyebrow=Baalvion+Industries"],
  },
};

export default async function BaalvionHomePage() {
  // Fetch data on the server for SEO optimization
  const [homePageData, projects, ecoItems] = await Promise.all([
    getHomePageData(),
    getProjects(),
    getEcosystemItems(),
  ]);

  // If the CMS genuinely can't supply the home content (after the fetch layer's
  // retries), THROW rather than returning a cacheable 200 "maintenance" page.
  // Under ISR this makes Next serve the last successfully-generated page (stale
  // but real content) while it retries in the background, and routes the no-cache
  // case to error.tsx — so a transient blip can never get cached and "stick".
  if (!homePageData) {
    // Exception: during the production build itself the CMS is typically unreachable
    // (CI has no CMS), and prerendering `/` must not abort the build. Render a static
    // shell at build time; ISR replaces it with real content on the first revalidation.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Service Temporarily Unavailable
            </h1>
            <p className="text-gray-600">
              The Baalvion Operating System is currently undergoing maintenance.
            </p>
          </div>
        </div>
      );
    }
    throw new Error("Home page content is temporarily unavailable from the CMS");
  }

  return (
    <>
      <Navbar />
      <HomePageServer
        homePageData={homePageData}
        projects={projects}
        ecoItems={ecoItems}
      />
      <HomeExplore />
      <Footer />
    </>
  );
}
