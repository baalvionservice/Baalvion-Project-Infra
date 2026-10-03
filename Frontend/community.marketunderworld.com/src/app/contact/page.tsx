import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact the Market Underworld Community team, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">Legal</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">Contact Us</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">How to reach us about orders, payments, or anything else.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">Last updated: October 4, 2026</p>
        <div className="mt-12 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Support</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Orders, returns, account access and anything else about the platform: support@baalvion.com. We reply within 2 business days.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Billing and payments</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Charges, refunds and failed payments: billing@baalvion.com. Include the order or transaction ID.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Phone</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">+91 89512 84770</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Complaints</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">To escalate a complaint to the Grievance Officer, see the Grievance Redressal page. We acknowledge within 48 hours.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Legal and privacy</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">legal@baalvion.com</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Operator</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
