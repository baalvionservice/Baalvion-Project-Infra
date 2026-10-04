import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Service Delivery Policy",
  description: "Service Delivery Policy — Baalvion, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container py-20 md:py-28 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground">Service Delivery Policy</h1>
          <p className="mt-4 text-lg text-muted-foreground">How access to the Baalvion Global Trade Platform is delivered. Nothing is shipped physically.</p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: October 4, 2026</p>
        </header>
        <div className="bg-card p-8 md:p-12 rounded-lg border shadow-sm text-left space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">1. Digital service</h2>
            <p className="text-muted-foreground leading-relaxed">The Baalvion Global Trade Platform is a hosted online service. No physical goods are sold or shipped, so no shipping charges apply.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">2. When access starts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>After you register and pay, your organisation enters onboarding.</li>
              <li>Access to trading, escrow and finance features is released once identity and business verification (KYC/KYB) is complete. Most organisations complete this within 2 to 5 business days after submitting complete documents.</li>
              <li>Read-only features that need no verification are available immediately after sign-up.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">3. Delivery confirmation</h2>
            <p className="text-muted-foreground leading-relaxed">You receive an email confirming activation, and the plan shows as active in your account. If you have paid and have not received it within 3 business days of submitting complete documents, email support@baalvion.com and we will either activate it or refund you.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">4. Where we deliver</h2>
            <p className="text-muted-foreground leading-relaxed">The service is available worldwide except where law, sanctions or our compliance requirements prevent us from serving a person, organisation or territory.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">5. Physical freight and logistics</h2>
            <p className="text-muted-foreground leading-relaxed">Cargo moved by users through the platform is carried by the carriers and forwarders they select. Delivery of that cargo is governed by the contracts between those parties, not by this policy.</p>
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
