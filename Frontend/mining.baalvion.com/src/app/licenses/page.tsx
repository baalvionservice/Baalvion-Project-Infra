import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheck, Building2, Landmark, Leaf, BadgeCheck, FileBadge, Mountain, Pickaxe,
  ArrowRight, CalendarClock, Eye,
} from "lucide-react";
import { getPublicLicenses, getLicensesByKind, companyFacts } from "@/lib/content/store";
import { LICENSE_KINDS } from "@/lib/content/license-kinds";
import type { LicenseKind } from "@/lib/content/types";
import { ComplianceSummary } from "@/components/licenses/ComplianceSummary";
import { LicenseStatusBadge } from "@/components/licenses/LicenseStatusBadge";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "Licenses & Compliance Center",
  description:
    "Baalvion's compliance framework: quarry and mining licenses, environmental clearances, government approvals, registrations and certifications. Documentation available to verified parties on request.",
  alternates: { canonical: "https://mining.baalvion.com/licenses" },
};

const ICONS: Record<string, typeof ShieldCheck> = {
  Mountain, Pickaxe, Leaf, Landmark, FileBadge, Building2, BadgeCheck,
};

export default async function LicensesPage() {
  const licenses = await getPublicLicenses();
  const kinds = Object.entries(LICENSE_KINDS) as [LicenseKind, (typeof LICENSE_KINDS)[LicenseKind]][];

  // Resolve a representative status per category from real records (else not-disclosed).
  const statusByKind = await Promise.all(
    kinds.map(async ([kind]) => {
      const rows = await getLicensesByKind(kind);
      return [kind, rows[0]?.status ?? "not-disclosed"] as const;
    }),
  );
  const statusMap = Object.fromEntries(statusByKind) as Record<LicenseKind, (typeof statusByKind)[number][1]>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary">
              <ShieldCheck className="h-4 w-4" /> Compliance Center
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">Licenses &amp; Compliance</h1>
            <p className="max-w-2xl text-lg text-primary-foreground/75 leading-relaxed">
              Baalvion Industries Private Limited operates within the regulatory frameworks
              governing quarrying, mining, environmental protection and corporate conduct.
              License and certificate documentation is provided to verified counterparties and
              authorities on request.
            </p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-7xl mx-auto py-12 space-y-10">
          <ComplianceSummary licenses={licenses} />

          {/* Real corporate registration — the only hard fact we publish */}
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary/5 p-3 text-primary">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Corporate Registration</p>
                  <p className="text-lg font-bold text-slate-900">{companyFacts.legalName}</p>
                  <p className="text-sm text-primary font-bold mt-0.5">CIN: {companyFacts.cin}</p>
                  <p className="text-xs text-slate-500 mt-1">Certificate of Incorporation — available upon request.</p>
                </div>
              </div>
              <LicenseStatusBadge status="active" />
            </CardContent>
          </Card>

          {/* License-kind framework grid */}
          <div>
            <h2 className="text-2xl font-headline font-bold text-primary mb-2">Our Compliance Framework</h2>
            <p className="text-slate-500 mb-6 max-w-2xl">
              The categories of licenses, approvals and registrations we maintain. Specific
              records are published here as they are released; until then, documentation is
              available to verified parties.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {kinds.map(([kind, meta]) => {
                const Icon = ICONS[meta.icon] ?? ShieldCheck;
                return (
                  <Link key={kind} href={`/licenses/${meta.slug}`}>
                    <Card className="border-none shadow-sm hover:shadow-md transition-all h-full group">
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="rounded-xl bg-primary/5 p-2.5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Icon className="h-5 w-5" />
                          </div>
                          <LicenseStatusBadge status={statusMap[kind]} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{meta.label}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">{meta.blurb}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary pt-1">
                          View category <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Validity-indicator legend + request CTA */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="border-none shadow-sm lg:col-span-2">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><CalendarClock className="h-4 w-4 text-secondary" /> Validity indicators</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Where a published record carries a genuine expiry date, the platform shows a live
                  validity indicator (valid / renewing within 90 days / expired). Status badges
                  reflect the current state of each record. We never display placeholder license
                  numbers or certificates.
                </p>
                <PendingDisclosure label="Individual license records and downloadable certificates are pending company disclosure and will appear here once published." />
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6 space-y-4">
                <Eye className="h-7 w-7 text-secondary" />
                <h3 className="text-lg font-bold">Request documentation</h3>
                <p className="text-sm text-primary-foreground/75">
                  Verified counterparties and authorities can request our license and certificate
                  documentation directly.
                </p>
                <Link href="/contact"><Button className="bg-secondary text-secondary-foreground font-bold w-full">Contact compliance</Button></Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
