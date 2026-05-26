import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Container } from "@/design-system/layout/container";
import { EntityHeader } from "@/components/knowledge/EntityHeader";
import { EntityOverview } from "@/components/knowledge/EntityOverview";
import { DataTable } from "@/components/knowledge/DataTable";
import { RelatedEntities } from "@/components/knowledge/RelatedEntities";
import { getTechnologyBySlug } from "@/lib/data/loaders";
import { generateEntityMetadata } from "@/lib/utils/seo";
import { QuickStats } from "@/components/entity/QuickStats";
import { RelatedHighlights } from "@/components/entity/RelatedHighlights";
import { AIInsight } from "@/components/ai/AIInsight";
import { EntityAnalytics } from "@/components/entity/EntityAnalytics";
import { EntityTags } from "@/components/entity/EntityTags";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tech = await getTechnologyBySlug(slug);

  if (!tech) {
    return { title: "Technology Not Found" };
  }

  return generateEntityMetadata(tech, "technology");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const tech = await getTechnologyBySlug(slug);

  if (!tech) {
    notFound();
  }

  const technicalData = [
    ["Inception Node", tech.invented_year],
    ["Primary Domain", tech.category],
    ["Core Applications", tech.applications.join(", ")],
  ];

  const quickStats = [
    { label: "Inception", value: tech.invented_year },
    { label: "App Nodes", value: tech.applications.length },
    { label: "Domain", value: tech.category },
  ];

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container>
        <EntityHeader name={tech.name} type="Technology" tags={tech.tags} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 space-y-12">
            <EntityOverview description={tech.description} />

            <QuickStats stats={quickStats} />

            <DataTable
              title="Instructional Layer"
              headers={["Technical Node", "Value"]}
              rows={technicalData}
            />

            <EntityAnalytics type="technology" slug={tech.slug} />

            <RelatedEntities
              entities={[
                ...tech.key_companies.map((k: string) => ({
                  id: `company-${k}`,
                  name: k.charAt(0).toUpperCase() + k.slice(1),
                  slug: k,
                  type: "company" as const,
                  description: `Company: ${k}`,
                  category: "company",
                  tags: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })),
                ...tech.related_technologies.map((t: string) => ({
                  id: `tech-${t}`,
                  name: t.replace("-", " "),
                  slug: t,
                  type: "technology" as const,
                  description: `Technology: ${t}`,
                  category: "technology",
                  tags: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })),
              ]}
            />
          </div>

          <aside className="lg:col-span-4 space-y-10">
            <div className="sticky top-24 space-y-10">
              <EntityTags entity={tech} type="technology" />
              <AIInsight entityType="technology" slug={tech.slug} />
              <RelatedHighlights entityId={tech.id} />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
