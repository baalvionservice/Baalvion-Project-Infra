import { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ProjectsPageServer from "@/components/projects-page-server";
import { getProjects } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "Projects | Strategic BOS Initiatives",
  description:
    "A curated landscape of high-impact infrastructure projects architected to resolve terminal fragmentation in global commerce and financial clearing.",
  openGraph: {
    title: "Projects | Strategic BOS Initiatives",
    description:
      "A curated landscape of high-impact infrastructure projects architected to resolve terminal fragmentation in global commerce and financial clearing.",
    url: "https://about.baalvion.com/projects",
    siteName: "Baalvion Operating System (BOS)",
    images: [
      {
        url: "https://picsum.photos/seed/baalvion-projects/1200/630",
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
    images: ["https://picsum.photos/seed/baalvion-projects/1200/630"],
  },
};

export default async function Page() {
  // Fetch projects data on the server for SEO optimization
  const projects = await getProjects();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <ProjectsPageServer projects={projects} />
      <Footer />
    </div>
  );
}
