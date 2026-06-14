import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Info,
  ListChecks,
  UserPlus,
  Scale,
  Mail,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tenders & Procurement",
  description:
    "Supplier and vendor engagement with Baalvion Mining Inc. — how to participate, current tenders, vendor registration, and our procurement principles.",
  alternates: { canonical: "https://mining.baalvion.com/tenders" },
};

function PendingDisclosure({ label }: { label?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-6 flex items-start gap-3 text-slate-500">
      <Info className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-slate-600">
          Information pending company disclosure.
        </p>
        {label ? <p className="text-xs text-slate-400 mt-1">{label}</p> : null}
      </div>
    </div>
  );
}

const steps = [
  {
    title: "Register as a Vendor",
    desc: "Submit your company details and capability profile to join our supplier database.",
  },
  {
    title: "Review Published Tenders",
    desc: "Active tender opportunities will be published on this page when available.",
  },
  {
    title: "Submit Your Proposal",
    desc: "Respond to relevant tenders following the instructions in each published notice.",
  },
  {
    title: "Evaluation & Award",
    desc: "Submissions are assessed against transparent, published criteria.",
  },
];

const principles = [
  {
    title: "Fairness",
    desc: "All suppliers are treated equitably and given fair access to opportunities.",
  },
  {
    title: "Transparency",
    desc: "Tender criteria and processes are clear, documented, and consistently applied.",
  },
  {
    title: "Integrity",
    desc: "We expect and uphold ethical conduct throughout the procurement process.",
  },
  {
    title: "Value & Responsibility",
    desc: "We seek value for money alongside responsible and sustainable sourcing.",
  },
];

export default function TendersPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16 lg:py-24 relative overflow-hidden">
          <div
            className="absolute right-0 top-0 p-12 opacity-10"
            aria-hidden="true"
          >
            <FileText className="h-72 w-72" />
          </div>
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">
              Tenders &amp; Procurement
            </Badge>
            <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight max-w-3xl">
              Partner With Us as a Supplier
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
              Baalvion Mining Inc. works with capable, responsible suppliers and
              vendors. We are committed to a fair and transparent procurement
              process.
            </p>
          </div>
        </section>

        <div className="container px-4 md:px-8 max-w-7xl mx-auto py-16 space-y-12">
          <section aria-labelledby="how-to-participate" className="space-y-6">
            <div className="flex items-center gap-3">
              <ListChecks className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="how-to-participate"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                How to Participate
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, idx) => (
                <Card key={step.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section aria-labelledby="current-tenders" className="space-y-4">
            <h2
              id="current-tenders"
              className="text-2xl md:text-3xl font-bold text-slate-900"
            >
              Current Tenders
            </h2>
            <Card className="border-none shadow-sm">
              <CardContent className="p-8 text-center space-y-4">
                <div className="p-4 rounded-2xl bg-slate-100 w-fit mx-auto">
                  <FileText
                    className="h-8 w-8 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No active tenders at this time
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto">
                  There are currently no open tender opportunities. New tenders
                  will be published here as they become available. We encourage
                  interested suppliers to register so they can be notified.
                </p>
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="vendor-registration" className="space-y-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="vendor-registration"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Vendor Registration
              </h2>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-3xl">
              Suppliers and vendors interested in working with us are invited to
              register. Please send your company profile, capabilities, and
              relevant credentials to our procurement team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="font-bold h-12 gap-2">
                <a href="mailto:procurement@baalvion.com">
                  <Mail className="h-4 w-4" /> procurement@baalvion.com
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="font-bold h-12 border-slate-200"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
            <PendingDisclosure label="Online vendor registration portal and pre-qualification requirements." />
          </section>

          <section aria-labelledby="procurement-principles" className="space-y-6">
            <div className="flex items-center gap-3">
              <Scale className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2
                id="procurement-principles"
                className="text-2xl md:text-3xl font-bold text-slate-900"
              >
                Procurement Principles
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {principles.map((p) => (
                <Card key={p.title} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {p.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {p.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
