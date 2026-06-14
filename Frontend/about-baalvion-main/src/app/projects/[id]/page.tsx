import { cmsGetProject, cmsGetProjects } from "@/lib/cms";
import { Metadata } from "next";
import ProjectDetailClient from "./project-detail-client";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbSchema, creativeWorkSchema } from "@/lib/schema";

const BASE_URL = "https://about.baalvion.com";

// Incremental Static Regeneration: project pages are statically generated and
// refreshed from the CMS at most once per hour.
export const revalidate = 3600;

// Pre-render known project URLs at build time; unknown ids render on demand.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const projects = await cmsGetProjects();
  return projects.filter((p) => p.id).map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = await cmsGetProject(id);

  const title = project ? `${project.name} | Baalvion Project` : "Project Brief";
  const description = project?.description || "Explore strategic infrastructure initiatives within the Baalvion Nexus.";
  const url = `${BASE_URL}/projects/${id}`;
  const ogImage =
    project?.seo?.ogImage ||
    `${BASE_URL}/api/og?title=${encodeURIComponent(project?.name || "Baalvion Project")}&eyebrow=${encodeURIComponent("Baalvion Project")}`;

  return {
    title,
    description,
    keywords: project?.seo?.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Baalvion Operating System (BOS)',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: project?.name || 'Baalvion Project',
        },
      ],
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    }
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await cmsGetProject(id);

  const schema = project
    ? [
        breadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Projects", url: "/projects" },
          { name: project.name, url: `/projects/${id}` },
        ]),
        creativeWorkSchema({
          name: project.name,
          description: project.description,
          url: `${BASE_URL}/projects/${id}`,
          image: project.seo?.ogImage,
          datePublished: project.createdAt,
          dateModified: project.updatedAt,
          about: project.category,
        }),
      ]
    : null;

  return (
    <>
      {schema && <JsonLd data={schema} />}
      <ProjectDetailClient id={id} />
    </>
  );
}
