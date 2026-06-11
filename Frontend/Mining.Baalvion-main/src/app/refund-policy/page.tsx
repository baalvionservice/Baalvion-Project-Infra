import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "How cancellations, refunds, and escrowed trade funds are handled on the Baalvion Mining platform, including platform/subscription fees, escrow release conditions, and how to request a refund.",
  alternates: { canonical: "https://mining.baalvion.com/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">Refund &amp; Cancellation Policy</h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              This Refund &amp; Cancellation Policy explains how cancellations and refunds are handled on the Baalvion
              Mining platform (the &quot;Platform&quot;), operated by Baalvion Industries Private Limited under the
              brand Baalvion Mining Inc. It distinguishes between fees charged by the Platform and funds held in escrow
              for trades between users.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Platform / Subscription Fees vs. Escrowed Trade Funds</h2>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li>
                  <strong>Platform / subscription fees</strong> are amounts you pay to us for access to or use of the
                  Platform and its services, as per the applicable order or agreement.
                </li>
                <li>
                  <strong>Escrowed trade funds</strong> are amounts deposited in connection with a trade between a buyer
                  and a seller. These funds belong to the trading parties and are governed by the applicable trade or
                  escrow agreement, not by these fee terms.
                </li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Cancellation of Platform Services</h2>
              <p>
                You may cancel a Platform service or subscription in accordance with the applicable order or agreement.
                Unless otherwise stated in that agreement or required by law, fees already incurred for services
                rendered are non-refundable. Where a cancellation right or pro-rata treatment applies, it will be set
                out in the relevant order or agreement.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Escrow Release &amp; Refund Conditions</h2>
              <p>
                Release or refund of escrowed trade funds is handled per the relevant trade agreement and the
                Platform&apos;s dispute-resolution process. Funds are released to the seller, returned to the buyer, or
                otherwise allocated based on the agreed milestones, conditions, and the outcome of any dispute. We act
                as a facilitator and apply the agreed conditions; we are not a party to the underlying trade contract.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. How to Request a Refund or Cancellation</h2>
              <p>
                To request a cancellation or refund, contact us at <strong>trade@baalvion.com</strong> with your account
                details, the relevant order or trade reference, and the reason for your request. For escrow-related
                matters, you may also raise the issue through the Platform&apos;s dispute-resolution process where
                available.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Processing Timelines</h2>
              <p>
                Approved refunds are processed within a reasonable period, subject to verification and the relevant
                payment or escrow provider&apos;s processing times. Timelines for escrowed funds depend on the trade
                agreement and the resolution of any dispute.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Taxes &amp; Charges</h2>
              <p>
                Refunds, where applicable, are made net of any taxes, levies, or third-party processing charges that are
                non-recoverable, unless otherwise required by law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Contact</h2>
              <p>
                For questions about refunds or cancellations, contact Baalvion Industries Private Limited at{" "}
                <strong>trade@baalvion.com</strong> or +91 89512 84770.
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
