import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ProjectsPageServer from "@/components/projects-page-server";
import { getProjects } from "@/lib/server-data";
import { JsonLd } from "@/components/json-ld";
import { BASE_URL, breadcrumbSchema, collectionSchema } from "@/lib/schema";

const PROJECTS_DESCRIPTION =
  "A curated landscape of high-impact infrastructure projects architected to resolve terminal fragmentation in global commerce and financial clearing.";

export const metadata: Metadata = {
  title: "Projects | Strategic BOS Initiatives",
  description:
    "A curated landscape of high-impact infrastructure projects architected to resolve terminal fragmentation in global commerce and financial clearing.",
  alternates: { canonical: "https://about.baalvion.com/projects" },
  openGraph: {
    title: "Projects | Strategic BOS Initiatives",
    description:
      "A curated landscape of high-impact infrastructure projects architected to resolve terminal fragmentation in global commerce and financial clearing.",
    url: "https://about.baalvion.com/projects",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://about.baalvion.com/api/og?title=Baalvion+Strategic+Portfolio&eyebrow=Baalvion+Industries",
        width: 1200,
        height: 630,
        alt: "Baalvion Strategic Projects",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | Strategic BOS Initiatives",
    description:
      "A curated landscape of high-impact infrastructure projects architected to resolve terminal fragmentation in global commerce and financial clearing.",
    images: ["https://about.baalvion.com/api/og?title=Baalvion+Strategic+Portfolio&eyebrow=Baalvion+Industries"],
  },
};

export default async function Page() {
  // Fetch projects data on the server for SEO optimization
  const projects = await getProjects();

  const schema = [
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Projects", url: "/projects" },
    ]),
    collectionSchema({
      name: "Projects",
      description: PROJECTS_DESCRIPTION,
      url: `${BASE_URL}/projects`,
      items: projects
        .filter((p) => p.id)
        .map((p) => ({ name: p.name, url: `/projects/${p.id}` })),
    }),
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <JsonLd data={schema} />
      <Navbar />
      <ProjectsPageServer projects={projects} />
      <Footer />
    </div>
  );
}
