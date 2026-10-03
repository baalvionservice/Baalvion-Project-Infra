import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Service Delivery Policy",
  description: "Service Delivery Policy — ControlTheMarket, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container py-20 md:py-28 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground">Service Delivery Policy</h1>
          <p className="mt-4 text-lg text-muted-foreground">How access to ControlTheMarket plans is delivered. Nothing is shipped physically.</p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: October 4, 2026</p>
        </header>
        <div className="bg-card p-8 md:p-12 rounded-lg border shadow-sm text-left space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">1. Digital service</h2>
            <p className="text-muted-foreground leading-relaxed">ControlTheMarket is an online hiring and skills platform. No physical goods are sold or shipped, so no shipping charges apply.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">2. When access starts</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Once your payment is confirmed, the plan you bought is active on your account, normally within a few minutes.</li>
              <li>Features appear immediately in your dashboard. You will receive a confirmation email and an invoice.</li>
              <li>Custom and Enterprise plans are provisioned after the agreement is signed, on the date agreed.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">3. If your plan is not activated</h2>
            <p className="text-muted-foreground leading-relaxed">If you have paid and the plan is not active after 30 minutes, email support@baalvion.com with the payment reference. We will activate it or refund you.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">4. Availability</h2>
            <p className="text-muted-foreground leading-relaxed">The service is available worldwide except where law or sanctions prevent us from serving a person or territory.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">Operator</h2>
            <p className="text-muted-foreground leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
