import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Container } from "@/design-system/layout/container";
import { EntityHeader } from "@/components/knowledge/EntityHeader";
import { EntityOverview } from "@/components/knowledge/EntityOverview";
import { DataTable } from "@/components/knowledge/DataTable";
import { RelatedEntities } from "@/components/knowledge/RelatedEntities";
import { getIndustryBySlug } from "@/lib/data/loaders";
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
  const industry = await getIndustryBySlug(slug);

  if (!industry) {
    return { title: "Industry Not Found" };
  }

  return generateEntityMetadata(industry, "industry");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const industry = await getIndustryBySlug(slug);

  if (!industry) {
    notFound();
  }

  const technicalData = [
    ["Market Velocity (Growth)", industry.growth_rate],
    ["Global Scale", industry.global_market_size],
    ["Primary Taxonomies", industry.tags.join(", ")],
  ];

  const quickStats = [
    { label: "Global Size", value: industry.global_market_size },
    { label: "Growth Target", value: industry.growth_rate },
    { label: "Active Hubs", value: industry.top_countries.length },
  ];

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <Container>
        <EntityHeader
          name={industry.name}
          type="Industry"
          tags={industry.tags}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 space-y-12">
            <EntityOverview description={industry.description} />

            <QuickStats stats={quickStats} />

            <DataTable
              title="Market Architecture"
              headers={["Strategic Node", "Value"]}
              rows={technicalData}
            />

            <EntityAnalytics type="industry" slug={industry.slug} />

            <RelatedEntities
              entities={[
                ...industry.top_countries.map((c: string) => ({
                  id: `country-${c}`,
                  name: c.replace("-", " "),
                  slug: c,
                  type: "country" as const,
                  description: `Country: ${c}`,
                  category: "country",
                  tags: [],
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })),
                ...industry.key_companies.map((k: string) => ({
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
                ...industry.related_technologies.map((t: string) => ({
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
              <EntityTags entity={industry} type="industry" />
              <AIInsight entityType="industry" slug={industry.slug} />
              <RelatedHighlights entityId={industry.id} />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
