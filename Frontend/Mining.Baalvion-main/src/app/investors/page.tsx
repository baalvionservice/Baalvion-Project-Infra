import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  TrendingUp,
  FileText,
  Mail,
  ArrowRight,
} from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PendingDisclosure } from "@/components/company/PendingDisclosure";
import { InvestorContactForm } from "./InvestorContactForm";

export const metadata: Metadata = {
  title: "Investor Relations",
  description:
    "Investor Relations for Baalvion Mining Inc., the operating brand of Baalvion Industries Private Limited. Corporate information, governance, and disclosure — financials pending public disclosure.",
  alternates: { canonical: "https://mining.baalvion.com/investors" },
  openGraph: {
    title: "Investor Relations",
    description:
      "Corporate information, governance, and investor contact for Baalvion Mining Inc.",
    url: "https://mining.baalvion.com/investors",
    siteName: "Baalvion Mining Inc.",
  },
};

const CORPORATE_INFO = [
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

const FINANCIAL_ITEMS = [
  "Revenue",
  "Profitability",
  "Balance Sheet",
  "Trading Volumes",
];

const CORPORATE_DOCUMENTS = [
  {
    title: "Certificate of Incorporation",
    status: "Available upon request",
    available: true,
  },
  {
    title: "Annual Filings & Financial Statements",
    status: "Pending public disclosure",
    available: false,
  },
];

export default function InvestorsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 text-primary-foreground lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="max-w-3xl space-y-6">
              <Badge className="bg-secondary text-secondary-foreground px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                Investor Relations
              </Badge>
              <h1 className="text-4xl font-headline font-bold leading-[1.1] tracking-tighter md:text-6xl">
                Investor Relations
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
                Transparent corporate information for current and prospective
                stakeholders of Baalvion Mining Inc. As a young company, certain
                disclosures remain pending — and we mark them clearly.
              </p>
            </div>
          </div>
        </section>

        {/* Corporate Information */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="mb-10 max-w-2xl space-y-3">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
              Corporate Information
            </h2>
            <p className="text-muted-foreground">
              Official entity details for Baalvion Mining Inc.
            </p>
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="divide-y divide-border p-0">
              {CORPORATE_INFO.map((info) => (
                <div
                  key={info.label}
                  className="grid gap-1 px-6 py-5 md:grid-cols-[220px_1fr] md:items-center md:gap-6 md:px-8"
                >
                  <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {info.label}
                  </p>
                  <p className="text-sm font-semibold text-primary">{info.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Governance overview */}
        <section className="bg-muted/40 py-16 lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
                <div className="space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                    <ShieldCheck className="h-7 w-7 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold text-primary">
                    Corporate Governance
                  </h2>
                  <p className="max-w-xl leading-relaxed text-muted-foreground">
                    Baalvion Mining Inc. operates under a compliance-first
                    governance model with board oversight and dedicated risk and
                    compliance functions. Full governance detail is published on
                    our Leadership &amp; Governance page.
                  </p>
                </div>
                <Link
                  href="/leadership"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  View Governance
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Financial Disclosure */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="mb-10 max-w-2xl space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
              <TrendingUp className="h-7 w-7 text-secondary" />
            </div>
            <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
              Financial Disclosure
            </h2>
            <p className="text-muted-foreground">
              No financial figures are published until they are formally and
              publicly disclosed.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FINANCIAL_ITEMS.map((item) => (
              <Card key={item} className="border-border/60 shadow-sm">
                <CardContent className="space-y-4 p-6">
                  <h3 className="text-base font-bold text-primary">{item}</h3>
                  <PendingDisclosure
                    inline
                    label="Pending public disclosure"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Corporate Documents */}
        <section className="bg-muted/40 py-16 lg:py-24">
          <div className="container mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-10 max-w-2xl space-y-3">
              <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
                Corporate Documents
              </h2>
              <p className="text-muted-foreground">
                Key corporate documents and their current availability.
              </p>
            </div>

            <Card className="border-border/60 shadow-sm">
              <CardContent className="divide-y divide-border p-0">
                {CORPORATE_DOCUMENTS.map((doc) => (
                  <div
                    key={doc.title}
                    className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 shrink-0 text-primary" />
                      <p className="text-sm font-bold text-primary">{doc.title}</p>
                    </div>
                    {doc.available ? (
                      <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary/5 px-4 py-2 text-xs font-semibold text-primary">
                        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {doc.status}
                      </span>
                    ) : (
                      <PendingDisclosure inline label={doc.status} />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Investor Contact */}
        <section className="container mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                <Mail className="h-7 w-7 text-secondary" />
              </div>
              <h2 className="text-3xl font-headline font-bold tracking-tight text-primary md:text-4xl">
                Investor Contact
              </h2>
              <p className="max-w-lg leading-relaxed text-muted-foreground">
                For investor enquiries, governance questions, or document
                requests, reach our Investor Relations team. We treat every
                enquiry confidentially.
              </p>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Investor Relations
                    </p>
                    <a
                      href="mailto:investors@baalvion.com"
                      className="text-base font-bold text-primary hover:underline"
                    >
                      investors@baalvion.com
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 shadow-2xl">
              <CardContent className="p-8 md:p-10">
                <div className="mb-8 space-y-1">
                  <h3 className="text-2xl font-bold text-primary">
                    Investor Enquiry
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Confidential intake for Investor Relations
                  </p>
                </div>
                <InvestorContactForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
