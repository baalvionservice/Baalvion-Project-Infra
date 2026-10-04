import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Grievance Redressal",
  description: "Grievance Redressal — ControlTheMarket, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/grievance" },
};

export default function GrievancePage() {
  return (
    <div className="bg-background text-foreground">
      <div className="container py-20 md:py-28 max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground">Grievance Redressal</h1>
          <p className="mt-4 text-lg text-muted-foreground">How to raise a complaint about ControlTheMarket, who receives it, and how quickly it is answered.</p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: October 4, 2026</p>
        </header>
        <div className="bg-card p-8 md:p-12 rounded-lg border shadow-sm text-left space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">1. Who we are</h2>
            <p className="text-muted-foreground leading-relaxed">ControlTheMarket is operated by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), a company incorporated in India. This page sets out our grievance redressal mechanism in line with the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">2. Grievance Officer</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Designation: Grievance Officer, Baalvion Industries Private Limited</li>
              <li>Email: legal@baalvion.com</li>
              <li>Phone: +91 89512 84770</li>
              <li>Post: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">3. How to file a complaint</h2>
            <p className="text-muted-foreground leading-relaxed">Email the Grievance Officer with the details below. A complaint that arrives with these details can be investigated straight away; one that does not will cost you a round-trip of questions.</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Your name and the email address registered on your account</li>
              <li>Order, invoice or payment reference (for payment issues, the gateway transaction ID)</li>
              <li>A description of the problem and what outcome you are asking for</li>
              <li>Screenshots or documents that support the complaint, if you have them</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">4. What happens next</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>We acknowledge every complaint within 48 hours of receiving it and give you a reference number.</li>
              <li>We aim to resolve it, or tell you plainly why we cannot, within 30 days of receipt.</li>
              <li>Payment and refund complaints are prioritised. A confirmed double charge or a failed-payment debit is reversed to the original payment method.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl font-medium tracking-tight text-foreground border-b pb-2">5. If you are not satisfied</h2>
            <p className="text-muted-foreground leading-relaxed">If the outcome does not resolve your complaint, reply to the same thread and ask for escalation to a director of the company. You may also approach the National Consumer Helpline (1915, consumerhelpline.gov.in) or the consumer forum with jurisdiction over your place of residence.</p>
            <p className="text-muted-foreground leading-relaxed">For a payment that your bank or card issuer has debited but not credited to us, you can also raise the matter with your bank under the RBI framework for failed transactions.</p>
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
