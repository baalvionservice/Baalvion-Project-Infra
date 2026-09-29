import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AML / KYC Policy",
  description:
    "Baalvion Mining's commitment to anti-money-laundering and counter-terrorist-financing: customer due diligence, KYC verification, sanctions and PEP screening, transaction monitoring, and record-keeping aligned with applicable Indian AML norms.",
  alternates: { canonical: "https://mining.baalvion.com/aml-kyc" },
};

export default function AmlKycPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">AML / KYC Policy</h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Effective Date: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              Baalvion Industries Private Limited, operating the brand Baalvion Mining Inc. (the &quot;Company&quot;,
              &quot;we&quot;), is committed to preventing money laundering and the financing of terrorism across the
              Baalvion Mining platform (the &quot;Platform&quot;). This policy describes the principles and controls we
              apply, in alignment with applicable Indian anti-money-laundering (AML) norms.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Commitment to AML / CTF</h2>
              <p>
                We are committed to combating money laundering (AML) and counter-terrorist financing (CTF). We seek to
                ensure the Platform is not used to launder the proceeds of crime, evade sanctions, or finance unlawful
                activity, and we maintain a risk-based compliance programme to support this commitment.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Customer Due Diligence (KYC)</h2>
              <p>
                All business participants are required to complete Know Your Customer (KYC) verification before
                transacting on the Platform. Due diligence includes verifying the identity of the organisation, its
                beneficial owners, and its authorised representatives, and understanding the nature of the intended
                business relationship. We apply enhanced due diligence to higher-risk participants and relationships.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Document Verification</h2>
              <p>
                We collect and verify supporting documentation such as proof of incorporation, business registrations,
                identity documents, and authorised-signatory evidence. We may request additional information or
                documentation where necessary to complete or refresh verification.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. Sanctions &amp; PEP Screening</h2>
              <p>
                As a matter of policy, we screen participants against applicable sanctions and watchlists and assess
                exposure to politically exposed persons (PEPs). Where a participant presents an unacceptable risk, we
                may decline onboarding, restrict activity, or terminate the relationship.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Transaction Monitoring</h2>
              <p>
                We monitor activity on the Platform on a risk-based basis to identify unusual or potentially suspicious
                patterns inconsistent with a participant&apos;s known profile or legitimate business purpose.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Record-Keeping</h2>
              <p>
                We retain KYC records, due-diligence information, and transaction records for the periods required under
                applicable law. These records support our compliance obligations and may be made available to competent
                authorities where lawfully required.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Suspicious Activity Escalation</h2>
              <p>
                Where activity is identified as potentially suspicious, it is escalated for internal review. We take
                appropriate action, which may include requesting further information, suspending activity, and reporting
                to the relevant authorities in accordance with applicable law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">8. Cooperation With Authorities</h2>
              <p>
                We cooperate with law-enforcement and regulatory authorities and respond to lawful requests in
                accordance with applicable law. We will not tip off any participant where prohibited from doing so.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">9. Governance &amp; Review</h2>
              <p>
                This policy is reviewed and updated periodically to reflect changes in our risk profile and applicable
                law. Participants are expected to cooperate with our AML/KYC procedures as a condition of using the
                Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">10. Contact</h2>
              <p>
                For AML/KYC enquiries, contact Baalvion Industries Private Limited at{" "}
                <strong>trade@baalvion.com</strong>.
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
