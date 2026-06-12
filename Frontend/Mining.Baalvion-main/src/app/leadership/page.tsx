import type { Metadata } from "next";
import { Info } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { LeadershipGrid } from "@/components/company/LeadershipGrid";
import { GovernanceSection } from "@/components/company/GovernanceSection";
import { PendingDisclosure } from "@/components/company/PendingDisclosure";
import type { ExecutiveProfile } from "@/components/company/ExecutiveProfileCard";

export const metadata: Metadata = {
  title: "Leadership & Governance",
  description:
    "Meet the leadership behind Baalvion Mining Inc. and learn about our compliance-first corporate governance. Detailed executive bios are pending company disclosure.",
  alternates: { canonical: "https://mining.baalvion.com/leadership" },
  openGraph: {
    title: "Leadership & Governance",
    description:
      "Leadership and compliance-first corporate governance at Baalvion Mining Inc.",
    url: "https://mining.baalvion.com/leadership",
    siteName: "Baalvion Mining Inc.",
  },
};

const LEADERSHIP_PROFILES: ExecutiveProfile[] = [
  { id: "exec-1", role: "Executive Leadership", comingSoon: true },
  { id: "exec-2", role: "Executive Leadership", comingSoon: true },
  { id: "exec-3", role: "Executive Leadership", comingSoon: true },
];

export default function LeadershipPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="max-w-3xl space-y-6">
              <Badge className="bg-secondary text-secondary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                Leadership &amp; Governance
              </Badge>
              <h1 className="text-4xl font-headline font-bold leading-[1.1] tracking-tighter md:text-6xl">
                Leadership &amp; Governance
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
                Baalvion Mining Inc. is led by a team committed to disciplined,
                compliance-first stewardship of a global mineral trading network.
              </p>
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="mb-12 max-w-2xl space-y-3">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
              Executive Leadership
            </h2>
            <p className="text-muted-foreground">
              Detailed leadership biographies are pending company disclosure and
              will be published here.
            </p>
          </div>

          <LeadershipGrid profiles={LEADERSHIP_PROFILES} />

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-5">
            <Info
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              We do not publish names, photographs, or credentials until they are
              formally disclosed. Detailed leadership bios are{" "}
              <span className="font-semibold text-primary">
                pending company disclosure
              </span>
              .
            </p>
          </div>
        </section>

        {/* Governance */}
        <section className="bg-muted/40 py-16 lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <GovernanceSection />

            <div className="mt-10 grid gap-4 md:max-w-xl">
              <p className="text-sm font-medium text-muted-foreground">
                Board member details:
              </p>
              <PendingDisclosure />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
