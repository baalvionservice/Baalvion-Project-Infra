import type { Metadata } from "next";
import Image from "next/image";
import {
  Target,
  Eye,
  ShieldCheck,
  Globe2,
  Handshake,
  Gem,
  Building2,
  Network,
  CalendarCheck,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { PendingDisclosure } from "@/components/company/PendingDisclosure";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Baalvion Mining Inc., the operating brand of Baalvion Industries Private Limited — a global B2B mineral trading and commodity supply network built on a compliance-first foundation.",
  alternates: { canonical: "https://mining.baalvion.com/about" },
  openGraph: {
    title: "About Us",
    description:
      "The operating brand of Baalvion Industries Private Limited — a global B2B mineral trading and commodity supply network.",
    url: "https://mining.baalvion.com/about",
    siteName: "Baalvion Mining Inc.",
  },
};

const VALUES = [
  {
    icon: <ShieldCheck className="h-7 w-7 text-secondary" />,
    title: "Compliance First",
    description:
      "KYC, sanctions, and trade compliance are built into how we operate, not bolted on afterwards.",
  },
  {
    icon: <Handshake className="h-7 w-7 text-secondary" />,
    title: "Trusted Partnerships",
    description:
      "We act as a dependable counterparty across buyers, suppliers, and logistics partners.",
  },
  {
    icon: <Globe2 className="h-7 w-7 text-secondary" />,
    title: "Global Reach",
    description:
      "A network-led approach to sourcing and supplying minerals and commodities across borders.",
  },
  {
    icon: <Gem className="h-7 w-7 text-secondary" />,
    title: "Quality & Integrity",
    description:
      "We hold ourselves to disciplined standards in every transaction we facilitate.",
  },
];

const COMPANY_DETAILS = [
  { label: "Operating Brand", value: "Baalvion Mining Inc." },
  { label: "Legal Entity", value: "Baalvion Industries Private Limited" },
  { label: "CIN", value: "U43121OD2025PTC048479" },
  {
    label: "Registered Office",
    value:
      "C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha – 764036, India",
  },
  {
    label: "Headquarters",
    value: "Altamount Road, Lodha Altamount, Mumbai, Maharashtra – 400026, India",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <Badge className="bg-secondary text-secondary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                  About Baalvion Mining
                </Badge>
                <h1 className="text-4xl font-headline font-bold leading-[1.1] tracking-tighter md:text-6xl">
                  A Global B2B Mineral Trading &amp; Supply Network
                </h1>
                <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/80">
                  Baalvion Mining Inc. is the operating brand of Baalvion
                  Industries Private Limited — a compliance-first marketplace and
                  supply network connecting mineral buyers and suppliers across
                  global markets.
                </p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10">
                <Image
                  src={BRAND_IMAGES.company}
                  alt="Baalvion Mining corporate"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                  <Target className="h-7 w-7 text-secondary" />
                </div>
                <h2 className="text-2xl font-headline font-bold text-primary">
                  Our Mission
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  To make global mineral and commodity trade more accessible,
                  transparent, and compliant — connecting verified buyers and
                  suppliers through a single trusted network.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-4 p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                  <Eye className="h-7 w-7 text-secondary" />
                </div>
                <h2 className="text-2xl font-headline font-bold text-primary">
                  Our Vision
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  To become a global standard for B2B mineral trading, where
                  compliance and quality are the default and supply chains are
                  built on trust.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values */}
        <section className="bg-muted/40 py-16 lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="mx-auto mb-12 max-w-2xl space-y-3 text-center">
              <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
                Our Values
              </h2>
              <p className="text-muted-foreground">
                The principles that guide how Baalvion Mining Inc. operates.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((value) => (
                <Card key={value.title} className="border-border/60 shadow-sm">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                      {value.icon}
                    </div>
                    <h3 className="text-lg font-bold text-primary">{value.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Company Timeline */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="mb-12 max-w-2xl space-y-3">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
              Company Timeline
            </h2>
            <p className="text-muted-foreground">
              Baalvion is a young company. We publish only verified milestones.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex items-start gap-5 p-6 md:p-8">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <CalendarCheck className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black uppercase tracking-widest text-secondary">
                    2025
                  </p>
                  <p className="text-base font-bold text-primary">
                    Baalvion Industries Private Limited incorporated
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CIN U43121OD2025PTC048479
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Further milestones:
              </p>
              <PendingDisclosure />
            </div>
          </div>
        </section>

        {/* Corporate Structure */}
        <section className="bg-muted/40 py-16 lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-2">
              <div className="space-y-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                  <Network className="h-7 w-7 text-secondary" />
                </div>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
                  Corporate Structure
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  <span className="font-bold text-primary">Baalvion Mining Inc.</span>{" "}
                  is the operating brand under which{" "}
                  <span className="font-bold text-primary">
                    Baalvion Industries Private Limited
                  </span>{" "}
                  conducts its global B2B mineral trading and commodity supply
                  operations.
                </p>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="space-y-6 p-8">
                  <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Operating Brand
                      </p>
                      <p className="text-base font-bold text-primary">
                        Baalvion Mining Inc.
                      </p>
                    </div>
                  </div>
                  <div className="ml-7 h-6 w-px bg-border" aria-hidden="true" />
                  <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Legal Entity
                      </p>
                      <p className="text-base font-bold text-primary">
                        Baalvion Industries Private Limited
                      </p>
                      <p className="mt-1 text-xs font-bold text-secondary">
                        CIN: U43121OD2025PTC048479
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Registered Company Details */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="mb-10 max-w-2xl space-y-3">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
              Registered Company Details
            </h2>
            <p className="text-muted-foreground">
              Official entity information as filed at incorporation.
            </p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="divide-y divide-border p-0">
              {COMPANY_DETAILS.map((detail) => (
                <div
                  key={detail.label}
                  className="grid gap-1 px-6 py-5 md:grid-cols-[220px_1fr] md:items-center md:gap-6 md:px-8"
                >
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {detail.label}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {detail.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
