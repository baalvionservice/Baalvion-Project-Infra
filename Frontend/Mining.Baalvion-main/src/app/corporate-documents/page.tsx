import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";
import { FileText, ShieldCheck, Leaf, Scale, Building2, ArrowRight, Mail } from "lucide-react";
import { companyFacts } from "@/lib/content/store";
import { PendingDisclosure } from "@/components/common/PendingDisclosure";

export const metadata: Metadata = {
  title: "Corporate Documents",
  description:
    "Corporate document centre for Baalvion Industries Private Limited — registrations, policies, governance and disclosure documents. Statutory documents available on request.",
  alternates: { canonical: "https://mining.baalvion.com/corporate-documents" },
};

const POLICY_DOCS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "AML / KYC Policy", href: "/aml-kyc" },
  { label: "Responsible Sourcing", href: "/responsible-sourcing" },
  { label: "Data Processing Addendum", href: "/data-processing" },
  { label: "Refund & Cancellation", href: "/refund-policy" },
  { label: "Legal Disclaimer", href: "/disclaimer" },
];

export default function CorporateDocumentsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24">
          <div className="container px-4 md:px-8 max-w-5xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary">
              <FileText className="h-4 w-4" /> Document Centre
            </span>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">Corporate Documents</h1>
            <p className="max-w-2xl text-lg text-primary-foreground/75 leading-relaxed">
              Governance, registration, policy and disclosure documents for {companyFacts.legalName}.
              Statutory and regulatory documents are provided to verified stakeholders and
              authorities on request.
            </p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-5xl mx-auto py-12 space-y-12">
          {/* Registrations */}
          <div className="space-y-5">
            <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2"><Building2 className="h-6 w-6 text-secondary" /> Registrations &amp; Statutory</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Certificate of Incorporation</p>
                  <p className="font-bold text-slate-900">{companyFacts.legalName}</p>
                  <p className="text-sm text-primary font-bold">CIN: {companyFacts.cin}</p>
                  <Link href="/contact"><Button variant="outline" className="mt-2 w-full font-bold border-slate-200 text-slate-600">Available on request</Button></Link>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Annual Reports &amp; Filings</p>
                  <PendingDisclosure label="Annual reports and statutory filings are pending public disclosure." />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Governance & Compliance */}
          <div className="space-y-5">
            <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-secondary" /> Governance &amp; Compliance</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/licenses"><Card className="border-none shadow-sm hover:shadow-md transition-all h-full"><CardContent className="p-6 space-y-2"><Scale className="h-6 w-6 text-primary" /><h3 className="font-bold text-slate-900">Licenses &amp; Compliance</h3><span className="inline-flex items-center gap-1 text-xs font-bold text-primary">View centre <ArrowRight className="h-3.5 w-3.5" /></span></CardContent></Card></Link>
              <Link href="/certifications"><Card className="border-none shadow-sm hover:shadow-md transition-all h-full"><CardContent className="p-6 space-y-2"><ShieldCheck className="h-6 w-6 text-primary" /><h3 className="font-bold text-slate-900">Certifications</h3><span className="inline-flex items-center gap-1 text-xs font-bold text-primary">View <ArrowRight className="h-3.5 w-3.5" /></span></CardContent></Card></Link>
              <Link href="/esg"><Card className="border-none shadow-sm hover:shadow-md transition-all h-full"><CardContent className="p-6 space-y-2"><Leaf className="h-6 w-6 text-primary" /><h3 className="font-bold text-slate-900">ESG Report</h3><span className="text-xs text-slate-500">Pending public disclosure</span></CardContent></Card></Link>
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-5">
            <h2 className="text-2xl font-headline font-bold text-primary flex items-center gap-2"><FileText className="h-6 w-6 text-secondary" /> Policies</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {POLICY_DOCS.map((d) => (
                <Link key={d.href} href={d.href} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-primary hover:text-primary transition-colors flex items-center justify-between gap-2">
                  {d.label} <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Need a specific document?</h3>
                <p className="text-sm text-primary-foreground/75">Verified stakeholders can request statutory and regulatory documents.</p>
              </div>
              <a href={`mailto:${companyFacts.emails.investors}`}>
                <Button className="bg-secondary text-secondary-foreground font-bold gap-2"><Mail className="h-4 w-4" /> {companyFacts.emails.investors}</Button>
              </a>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
