import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getLicensesByKind } from "@/lib/content/store";
import { LICENSE_KINDS, LICENSE_KIND_BY_SLUG } from "@/lib/content/license-kinds";
import { LicenseCard } from "@/components/licenses/LicenseCard";
import { EmptyState } from "@/components/common/PendingDisclosure";

export function generateStaticParams() {
  return Object.values(LICENSE_KINDS).map((m) => ({ kind: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const { kind: slug } = await params;
  const kind = LICENSE_KIND_BY_SLUG[slug];
  const meta = kind ? LICENSE_KINDS[kind] : null;
  if (!meta) return { title: "Licenses" };
  return {
    title: meta.label,
    description: meta.blurb,
    alternates: { canonical: `https://mining.baalvion.com/licenses/${meta.slug}` },
  };
}

export default async function LicenseKindPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind: slug } = await params;
  const kind = LICENSE_KIND_BY_SLUG[slug];
  if (!kind) notFound();
  const meta = LICENSE_KINDS[kind];
  const licenses = await getLicensesByKind(kind);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-5xl mx-auto space-y-4">
            <Link href="/licenses" className="inline-flex items-center gap-2 text-sm font-bold text-primary-foreground/70 hover:text-secondary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Compliance Center
            </Link>
            <h1 className="text-3xl md:text-4xl font-headline font-bold">{meta.label}</h1>
            <p className="max-w-2xl text-primary-foreground/75 leading-relaxed">{meta.blurb}</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-5xl mx-auto py-12 space-y-8">
          {licenses.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-5">
              {licenses.map((l) => <LicenseCard key={l.id} license={l} />)}
            </div>
          ) : (
            <EmptyState
              title={`No published ${meta.label.toLowerCase()} on record`}
              message="Documentation for this category is available to verified counterparties and authorities on request, and will be published here as it is released."
              ctaHref="/contact"
              ctaLabel="Request documentation"
            />
          )}

          <Card className="border-none shadow-sm">
            <CardContent className="p-6 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500 leading-relaxed">
                Baalvion does not publish placeholder or unverified license references. Records in
                this category are shown only when issued and confirmed, with genuine authority,
                reference and validity details.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
