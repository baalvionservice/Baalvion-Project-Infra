import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms and conditions governing use of the Baalvion Mining B2B mineral trade, escrow, and KYC platform, including eligibility, fees, liability, governing law, and dispute resolution.",
  alternates: { canonical: "https://mining.baalvion.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container px-4 md:px-8 max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">Legal &amp; Compliance</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-headline font-bold tracking-tight">Terms of Service</h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-widest opacity-90">Last Updated: June 12, 2026</p>
          </div>
        </section>

        <section className="container px-4 md:px-8 max-w-4xl mx-auto py-12">
          <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm space-y-10 text-slate-600 leading-relaxed">
            <p className="text-lg text-slate-700">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Baalvion Mining platform
              (the &quot;Platform&quot;), operated by <strong>Baalvion Industries Private Limited</strong> under the
              brand <strong>Baalvion Mining Inc.</strong> (CIN U43121OD2025PTC048479). By accessing or using the
              Platform you agree to these Terms.
            </p>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">1. Acceptance of Terms</h2>
              <p>
                By registering for, accessing, or using the Platform, you confirm that you have read, understood, and
                agree to be bound by these Terms and our policies referenced herein. If you do not agree, you must not
                use the Platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">2. Eligibility (B2B Only)</h2>
              <p>
                The Platform is intended exclusively for businesses and their authorised representatives engaged in the
                lawful trade of minerals and commodities. By using the Platform you represent that you are at least 18
                years old, are authorised to bind the organisation you represent, and will use the Platform solely for
                legitimate business purposes. The Platform is not intended for consumers.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">3. Accounts &amp; Verification (KYC)</h2>
              <p>
                You must provide accurate, complete, and current information and complete our Know Your Customer (KYC)
                verification before transacting. You are responsible for maintaining the confidentiality of your
                credentials and for all activity under your account. We may refuse, suspend, or terminate accounts that
                fail verification or that we reasonably believe are involved in unlawful activity.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-8 space-y-2 text-sm">
                <li>Use the Platform for any unlawful, fraudulent, or deceptive purpose.</li>
                <li>Provide false documentation or impersonate any person or entity.</li>
                <li>Circumvent KYC, AML, sanctions screening, or security controls.</li>
                <li>Interfere with, disrupt, or attempt to gain unauthorised access to the Platform.</li>
                <li>Infringe the intellectual property or other rights of any party.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">5. Platform Role (Marketplace Intermediary)</h2>
              <p>
                The Platform operates as a marketplace and technology intermediary that connects verified buyers and
                sellers and provides supporting services such as escrow facilitation and KYC. Except where expressly
                stated, <strong>we are not a party to the trade contracts</strong> formed between users, do not take
                title to goods, and do not guarantee the quality, legality, safety, or delivery of any goods or the
                performance of any counterparty. Users are solely responsible for their own due diligence and contracts.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">6. Escrow &amp; Payments</h2>
              <p>
                Where escrow and settlement services are offered, funds are handled in accordance with the applicable
                order or escrow agreement and released subject to the agreed conditions and milestones. Payment
                processing and escrow may be provided through third-party service providers, whose terms may also apply.
                You are responsible for ensuring the accuracy of payout and banking information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">7. Fees</h2>
              <p>
                Fees for use of the Platform and its services are charged as per the applicable order, subscription, or
                agreement made available to you. Unless otherwise stated, fees are exclusive of taxes, which you are
                responsible for paying. We may modify fees prospectively with notice.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">8. Intellectual Property</h2>
              <p>
                The Platform, including its software, design, trademarks, and content (excluding user content), is owned
                by Baalvion Industries Private Limited or its licensors and is protected by applicable law. You are
                granted a limited, non-exclusive, non-transferable, revocable licence to use the Platform for its
                intended business purpose.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">9. Third-Party Content</h2>
              <p>
                The Platform may contain content, listings, links, or services provided by third parties. We do not
                endorse and are not responsible for third-party content or services, and your dealings with third
                parties are solely between you and them.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">10. Disclaimers &amp; No Warranty</h2>
              <p>
                The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties
                of any kind, whether express or implied, including warranties of merchantability, fitness for a
                particular purpose, accuracy, or non-infringement. We do not warrant that the Platform will be
                uninterrupted, error-free, or secure.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Baalvion Industries Private Limited and its
                affiliates, officers, employees, and agents shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages, or for any loss of profits, revenue, data, or goodwill, arising out
                of or relating to your use of the Platform. Our aggregate liability for any claim shall not exceed the
                fees paid by you to us for the service giving rise to the claim in the twelve (12) months preceding the
                claim.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">12. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Baalvion Industries Private Limited and its affiliates from any
                claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or
                related to your use of the Platform, your trade contracts, your content, or your breach of these Terms
                or applicable law.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">13. Suspension &amp; Termination</h2>
              <p>
                We may suspend or terminate your access to the Platform, with or without notice, if you breach these
                Terms, fail verification, or where required to comply with law or protect the Platform and its users.
                You may stop using the Platform at any time. Provisions that by their nature should survive termination
                will survive.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">14. Governing Law &amp; Jurisdiction</h2>
              <p>
                These Terms are governed by and construed in accordance with the laws of India. Subject to the dispute
                resolution clause below, the courts of <strong>Mumbai, Maharashtra, India</strong> shall have exclusive
                jurisdiction over any matter arising out of or relating to these Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">15. Dispute Resolution &amp; Arbitration</h2>
              <p>
                Any dispute, controversy, or claim arising out of or relating to these Terms shall first be attempted to
                be resolved amicably. Failing amicable resolution, the dispute shall be referred to and finally resolved
                by arbitration under the Arbitration and Conciliation Act, 1996. The seat and venue of arbitration shall
                be <strong>Mumbai, Maharashtra, India</strong>, the arbitration shall be conducted in English, and the
                arbitral award shall be final and binding on the parties.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">16. Force Majeure</h2>
              <p>
                We shall not be liable for any failure or delay in performance caused by events beyond our reasonable
                control, including acts of God, natural disasters, epidemics, war, civil unrest, governmental action,
                power or network failures, or third-party service disruptions.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">17. Modifications</h2>
              <p>
                We may modify these Terms from time to time. Material changes will be communicated through the Platform
                or other appropriate means. Your continued use after changes take effect constitutes acceptance of the
                revised Terms.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">18. Contact</h2>
              <p>
                Questions about these Terms may be directed to Baalvion Industries Private Limited at{" "}
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
