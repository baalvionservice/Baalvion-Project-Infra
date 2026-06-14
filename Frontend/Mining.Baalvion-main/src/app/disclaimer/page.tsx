import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Legal disclaimers for the Baalvion Mining platform: informational use only, no investment or financial advice, market data provided as-is, and no liability for counterparty performance.",
  alternates: { canonical: "https://mining.baalvion.com/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">Legal Disclaimer</h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              The information provided on the Baalvion Mining platform (the &quot;Platform&quot;), operated by Baalvion
              Industries Private Limited under the brand Baalvion Mining Inc., is for general informational purposes
              only. By using the Platform you acknowledge and accept the disclaimers below.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Informational Use Only</h2>
              <p>
                All content, including market intelligence, listings, guides, and reports, is provided for general
                information. It is not intended as, and should not be relied upon as, professional, legal, tax,
                accounting, or commercial advice. You should obtain independent professional advice before acting on
                any information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. No Investment or Financial Advice</h2>
              <p>
                Nothing on the Platform constitutes investment, financial, or trading advice, a recommendation, or a
                solicitation to buy or sell any commodity, security, or instrument. Any commercial decision you make is
                made at your own risk and discretion.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Market &amp; Price Data &quot;As Is&quot;</h2>
              <p>
                Market data, pricing indices, and analytics are provided on an &quot;as is&quot; and &quot;as
                available&quot; basis without warranty of accuracy, completeness, or timeliness. Commodity prices are
                volatile and subject to external forces. Past performance is not indicative of future results.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. No Liability for Counterparty Performance</h2>
              <p>
                The Platform facilitates connections between verified buyers and sellers but is not a party to the
                trade contracts between them. We do not guarantee and are not liable for the commercial conduct,
                solvency, performance, delivery, or legal compliance of any counterparty. Each user is responsible for
                its own due diligence.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Forward-Looking Statements</h2>
              <p>
                Any forward-looking statements, projections, or estimates reflect current expectations and involve
                known and unknown risks and uncertainties. Actual outcomes may differ materially. We undertake no
                obligation to update forward-looking statements except as required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. External Links</h2>
              <p>
                The Platform may contain links to third-party websites and resources. We do not control and are not
                responsible for the content, accuracy, or practices of any external site. Inclusion of a link does not
                imply endorsement.
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
