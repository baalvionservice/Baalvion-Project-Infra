import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Container } from "@/design-system/layout/container";
import { EntityHeader } from "@/components/knowledge/EntityHeader";
import { EntityOverview } from "@/components/knowledge/EntityOverview";
import { EntityEditorialOverview } from "@/components/knowledge/EntityEditorialOverview";
import { DataTable } from "@/components/knowledge/DataTable";
import { getCountryBySlug } from "@/lib/data/loaders";
import { generateEntityMetadata } from "@/lib/utils/seo";
import { structuredData } from "@/lib/seo/structuredData";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { Breadcrumbs } from "@/modules/seo-engine/components/Breadcrumbs";
import { breadcrumbService } from "@/modules/seo-engine/services/breadcrumb-service";
import { QuickStats } from "@/components/entity/QuickStats";
import { RelatedHighlights } from "@/components/entity/RelatedHighlights";
import { EntityTags } from "@/components/entity/EntityTags";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);
  if (!country) return { title: "Country Not Found" };
  return generateEntityMetadata(country, "country");
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const country = await getCountryBySlug(slug);

  if (!country) {
    notFound();
  }

  const technicalData = [
    ["Capital Node", country.capital],
    ["Geo Region", country.region],
    ["Purchasing Power (GDP)", country.gdp],
    ["Currency Hub", country.currency],
    ["Identity Language", country.official_language],
  ];

  const quickStats = [
    { label: "Nominal GDP", value: country.gdp },
    {
      label: "Population",
      value: (country.population / 1000000).toFixed(1) + "M",
    },
    { label: "Currency", value: country.currency },
  ];

  const schema = structuredData.entity(country, "country");
  // <Breadcrumbs> renders the visible trail AND injects its BreadcrumbList
  // JSON-LD from this same object, so the two can never mismatch (a separate
  // schema-only <JsonLd> here previously had no matching visible nav at all).
  const breadcrumb = breadcrumbService.generateBreadcrumbForEntity(country.name, country.slug, "countries", "Countries");

  return (
    <main className="min-h-screen bg-background pt-20 pb-32">
      <JsonLd data={schema} />
      <Container>
        <Breadcrumbs breadcrumb={breadcrumb} />
        <EntityHeader name={country.name} type="Country" tags={country.tags} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
          <div className="lg:col-span-8 space-y-12">
            <EntityOverview description={country.description} />

            <QuickStats stats={quickStats} />

            <DataTable
              title="Sovereign Vitals"
              headers={["Matrix Node", "Value"]}
              rows={technicalData}
            />

            <EntityEditorialOverview entityName={country.name} overview={country.editorialOverview} />
          </div>

          <aside className="lg:col-span-4 space-y-10">
            <div className="sticky top-24 space-y-10">
              <EntityTags entity={country} type="country" />
              <RelatedHighlights entityId={country.id} />
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
