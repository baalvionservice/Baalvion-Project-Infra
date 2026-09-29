import type { Metadata } from "next";
import { FileText, Pickaxe, Leaf, Award, ShieldCheck } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/company/PendingDisclosure";

export const metadata: Metadata = {
  title: "Certifications & Registrations",
  description:
    "Corporate registrations, mining licenses, environmental approvals, and quality certifications for Baalvion Mining Inc. Verified documentation is available upon request.",
  alternates: { canonical: "https://mining.baalvion.com/certifications" },
  openGraph: {
    title: "Certifications & Registrations",
    description:
      "Corporate registrations and compliance documentation for Baalvion Mining Inc. — available upon request.",
    url: "https://mining.baalvion.com/certifications",
    siteName: "Baalvion Mining Inc.",
  },
};

interface CertificationCategory {
  icon: React.ReactNode;
  category: string;
  description: string;
  status: string;
  /** When true, status renders as a PendingDisclosure callout instead of a line. */
  pending?: boolean;
  detail?: string;
}

const CATEGORIES: CertificationCategory[] = [
  {
    icon: <FileText className="h-7 w-7 text-secondary" />,
    category: "Corporate Registrations",
    description:
      "Baalvion Industries Private Limited — incorporated entity behind the Baalvion Mining Inc. brand.",
    detail: "CIN: U43121OD2025PTC048479",
    status: "Certificate of Incorporation — available upon request",
  },
  {
    icon: <Pickaxe className="h-7 w-7 text-secondary" />,
    category: "Mining Licenses",
    description:
      "Licensing and authorisations relevant to mineral trading and supply operations.",
    status: "Documentation available upon request",
  },
  {
    icon: <Leaf className="h-7 w-7 text-secondary" />,
    category: "Environmental Approvals",
    description:
      "Environmental clearances and approvals applicable to our operations.",
    status: "Documentation available upon request",
  },
  {
    icon: <Award className="h-7 w-7 text-secondary" />,
    category: "ISO / Quality Certifications",
    description:
      "Quality and management-system certification roadmap.",
    status: "Certification roadmap — information pending company disclosure",
    pending: true,
  },
];

export default function CertificationsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="max-w-3xl space-y-6">
              <Badge className="bg-secondary text-secondary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                Compliance &amp; Documentation
              </Badge>
              <h1 className="text-4xl font-headline font-bold leading-[1.1] tracking-tighter md:text-6xl">
                Certifications &amp; Registrations
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
                We publish only what we can verify. Where formal documentation
                exists, it is available upon request; where certification is still
                in progress, we say so plainly.
              </p>
            </div>
          </div>
        </section>

        {/* Categories grid */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="grid gap-6 md:grid-cols-2">
            {CATEGORIES.map((item) => (
              <Card key={item.category} className="border-border/60 shadow-sm">
                <CardContent className="space-y-5 p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                    {item.icon}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-headline font-bold text-primary">
                      {item.category}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                    {item.detail && (
                      <p className="text-xs font-bold text-secondary">
                        {item.detail}
                      </p>
                    )}
                  </div>

                  {item.pending ? (
                    <PendingDisclosure label={item.status} />
                  ) : (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-3">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm font-semibold text-primary">
                        {item.status}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-muted/40 p-6 md:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Baalvion Mining Inc. does not display certification numbers, license
              numbers, or approvals that have not been formally issued. Verified
              corporate documentation can be provided to counterparties on
              request. For documentation requests, contact{" "}
              <a
                href="mailto:trade@baalvion.com"
                className="font-bold text-primary underline"
              >
                trade@baalvion.com
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
