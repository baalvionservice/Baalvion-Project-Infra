import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund & Cancellation Policy — Baalvion, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container py-20 md:py-28 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground">Refund &amp; Cancellation Policy</h1>
          <p className="mt-4 text-lg text-muted-foreground">Cancellation and refund terms for Baalvion Global Trade Platform subscriptions.</p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: October 4, 2026</p>
        </header>
        <div className="bg-card p-8 md:p-12 rounded-lg border shadow-sm text-left space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">1. What this covers</h2>
            <p className="text-muted-foreground leading-relaxed">This policy applies to paid subscriptions to the Baalvion Global Trade Platform (SME Starter and Institutional Pro). Enterprise Global and Sovereign Edition agreements follow the refund and termination terms in their signed order form, which take precedence over this page.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">2. Cancelling</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>You can cancel a subscription at any time from your account settings or by emailing billing@baalvion.com.</li>
              <li>Cancellation stops the next renewal. Access continues until the end of the billing period you have already paid for.</li>
              <li>We do not refund the unused part of a billing period after the first 7 days, except as set out in section 3.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">3. Refunds</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>First purchase: if you ask within 7 days of your first payment and have not completed verified trade transactions through the platform, we refund the subscription fee in full.</li>
              <li>Service failure: if the platform is materially unavailable or does not perform as described and we cannot fix it within a reasonable time, we refund the affected period.</li>
              <li>Billing error or duplicate charge: refunded in full once verified.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">4. What is not refundable</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Transaction, escrow, customs, freight and third-party fees that were passed through to a bank, carrier, authority or other third party</li>
              <li>Fees for verification (KYC/KYB) work that has already been carried out</li>
              <li>Accounts closed for breach of the Terms of Use or for sanctions or fraud reasons</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">5. Funds held in escrow</h2>
            <p className="text-muted-foreground leading-relaxed">Money you place in escrow for a trade is not a platform fee. It is released or returned according to the trade terms and the escrow agreement between the parties, not by this policy.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">6. How refunds are paid</h2>
            <p className="text-muted-foreground leading-relaxed">Approved refunds are returned to the original payment method within 5 to 10 business days of approval. Bank-transfer payments are refunded to the remitting account.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">7. How to ask</h2>
            <p className="text-muted-foreground leading-relaxed">Email billing@baalvion.com with your account email, the invoice or transaction ID, and the reason. We reply within 2 business days.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">Operator</h2>
            <p className="text-muted-foreground leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
