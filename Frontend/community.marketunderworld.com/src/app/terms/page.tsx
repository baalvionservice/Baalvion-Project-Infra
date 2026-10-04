import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service — Market Underworld Community, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">Legal</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">Terms of Service</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">The rules for using the Market Underworld Community: accounts, the marketplace, content, and payments.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">Last updated: October 4, 2026</p>
        <div className="mt-12 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">1. Who we are and who you are contracting with</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">The Market Underworld Community (community.marketunderworld.com) is operated by Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, a company incorporated in India. These Terms form a contract between you and that company.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">2. Eligibility and accounts</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>You must be at least 18 years old and able to enter a binding contract.</li>
              <li>You are responsible for your account credentials and for everything done under your account. Tell us promptly if you suspect unauthorised use.</li>
              <li>The information you give us must be accurate, and you must keep it current.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">3. The marketplace</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">The marketplace lets independent sellers list goods and services. Unless an order says otherwise, the sale contract is between the buyer and the seller. We provide the platform, take payment and, where applicable, handle returns and refunds under our Refund &amp; Cancellation Policy.</p>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Sellers are responsible for the accuracy of their listings, for lawful sale of what they list, for dispatching on time, and for any licences, taxes and invoices the law requires.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">4. Prohibited goods, services and conduct</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">You may not list, sell, buy, or promote anything that is illegal where it is sold or delivered, or that infringes another person&apos;s rights. This includes:</p>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Narcotics, controlled substances, weapons, explosives, stolen or counterfeit goods</li>
              <li>Stolen data, access credentials, malware, or services that enable unauthorised access to systems</li>
              <li>Adult sexual content, or anything involving minors</li>
              <li>Fraud, money laundering, or evasion of sanctions</li>
              <li>Harassment, hate speech, threats, or doxxing</li>
              <li>Anything that requires a licence you do not hold</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">5. Content you post</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">You keep ownership of what you post. You give us a non-exclusive, worldwide licence to host, display and distribute it on the platform for as long as it is posted. You promise you have the right to post it. We may remove content that breaks these Terms or the law.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">6. Prices, payment and taxes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Prices are shown before you pay. Payment is taken through authorised payment gateways as described on our Payments page. Taxes, including GST where applicable, are shown on the invoice.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">7. Returns and refunds</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Cancellations, returns and refunds are governed by our Refund &amp; Cancellation Policy. Nothing in these Terms limits any right you have under the Consumer Protection Act, 2019 or the Consumer Protection (E-Commerce) Rules, 2020.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">8. Suspension and termination</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">We may suspend or close an account that breaks these Terms, creates legal risk, or is used for fraud. You may close your account at any time. Termination does not cancel money already owed or refunds already due.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">9. Disclaimers and liability</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">The platform is provided as available. We do not guarantee uninterrupted service, and we are not responsible for what independent sellers or other users post, except as the law requires.</p>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">To the extent the law allows, our total liability to you for a claim arising from the platform is limited to the amount you paid us for the order or service the claim concerns. Nothing here excludes liability that cannot be excluded by law.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">10. Governing law and disputes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">These Terms are governed by the laws of India. Subject to any mandatory consumer rights that give you the right to sue where you live, the courts of India have jurisdiction. Please use our Grievance Redressal process first.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">11. Changes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">We may update these Terms. If a change is material, we will tell you on the site or by email before it applies. Continuing to use the platform after that means you accept the new Terms.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">Operator</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </main>
    <Footer />
    </>
  );
}
