import { db } from "@/lib/db";
import { Metadata } from "next";
import ProjectDetailClient from "./project-detail-client";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const project = db.projects.getById(id);
  
  const title = project ? `${project.name} | Baalvion Project` : "Project Brief";
  const description = project?.description || "Explore strategic infrastructure initiatives within the Baalvion Nexus.";
  const url = `https://baalvion.nexus/projects/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Baalvion Nexus',
      images: [
        {
          url: `https://picsum.photos/seed/${id}/1200/630`,
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
      images: [`https://picsum.photos/seed/${id}/1200/630`],
    }
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailClient id={id} />;
}
