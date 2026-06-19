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

// Fully dynamic: the home page is rendered per-request from live CMS content and is
// never statically prerendered. This means the build never tries (and fails) to fetch
// the CMS, and every visitor gets the latest content managed in the admin platform.
export const dynamic = "force-dynamic";

export default async function BaalvionHomePage() {
  // Fetch data on the server for SEO optimization
  const [homePageData, projects, ecoItems] = await Promise.all([
    getHomePageData(),
    getProjects(),
    getEcosystemItems(),
  ]);

  // If the CMS genuinely can't supply the home content (after the fetch layer's
  // retries), THROW so Next routes to error.tsx (which auto-retries) instead of
  // rendering a cacheable "maintenance" page. With dynamic rendering there is no
  // build-time prerender, so this only ever fires at request time.
  if (!homePageData) {
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
