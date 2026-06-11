import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responsible Sourcing & Modern Slavery Statement",
  description:
    "Baalvion Mining's commitment to responsible mineral sourcing, OECD due-diligence alignment, a conflict-minerals stance, prohibition of forced and child labour, and supply-chain due-diligence expectations.",
  alternates: { canonical: "https://mining.baalvion.com/responsible-sourcing" },
};

export default function ResponsibleSourcingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">
              Responsible Sourcing &amp; Modern Slavery Statement
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              Baalvion Industries Private Limited, operating the brand Baalvion Mining Inc. (the &quot;Company&quot;), is
              committed to responsible mineral sourcing and to upholding human rights across the trade relationships
              facilitated by the Baalvion Mining platform (the &quot;Platform&quot;). This statement sets out our
              commitments and expectations.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Responsible Sourcing Commitment</h2>
              <p>
                We are committed to promoting responsible sourcing of minerals and to discouraging trade that
                contributes to conflict, human-rights abuses, or serious environmental harm. We expect participants on
                the Platform to source and trade minerals lawfully and responsibly.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. OECD Due-Diligence Alignment</h2>
              <p>
                We aspire to align our approach with the framework set out in the OECD Due Diligence Guidance for
                Responsible Supply Chains of Minerals from Conflict-Affected and High-Risk Areas. We reference this
                guidance as a framework for risk-based supply-chain due diligence.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Conflict-Minerals Stance</h2>
              <p>
                We do not condone the trade of minerals that directly or indirectly finance or benefit armed groups or
                that are sourced through serious human-rights abuses. We expect participants to take reasonable steps to
                ensure their supply chains are free from such sourcing.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. No Forced or Child Labour</h2>
              <p>
                We have zero tolerance for modern slavery, forced labour, bonded labour, human trafficking, and child
                labour in any part of the supply chains connected to the Platform. Participants must comply with
                applicable labour laws and respect the rights of workers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Supply-Chain Due-Diligence Expectations</h2>
              <p>Participants on the Platform are expected to:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li>Know their counterparties and the origin of the minerals they trade.</li>
                <li>Maintain appropriate records to support traceability.</li>
                <li>Identify and address risks in their supply chains on a risk-based basis.</li>
                <li>Comply with applicable sourcing, trade, and human-rights laws.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Grievance Channel</h2>
              <p>
                Concerns relating to responsible sourcing, labour practices, or supply-chain conduct connected to the
                Platform may be raised confidentially with us at <strong>trade@baalvion.com</strong>. We will review
                credible concerns and take appropriate action.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Program Specifics</h2>
              <p>
                Specific program metrics, audits, certifications, and formal due-diligence procedures: Information
                pending company disclosure.
              </p>
            </section>

            <div className="pt-8 border-t">
              <p className="text-xs text-slate-500 italic leading-relaxed">
                This document is provided for transparency and does not constitute legal advice. Baalvion Mining Inc.
                is a brand operated by Baalvion Industries Private Limited, incorporated in India under CIN
                U43121OD2025PTC048479.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
