import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy — Market Underworld Community, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">Legal</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">Privacy Policy</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">What the Market Underworld Community collects, why, who sees it, and the rights you have over it.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">Last updated: October 4, 2026</p>
        <div className="mt-12 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">1. Who is responsible</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Baalvion Industries Private Limited (CIN U43121OD2025PTC048479) is the data fiduciary for the Market Underworld Community. Questions go to legal@baalvion.com.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">2. What we collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Account details: name, email address, phone number, password (stored hashed)</li>
              <li>Order details: items, delivery address, billing details, and payment status. Card, UPI and bank credentials are entered with the payment gateway and are never stored by us.</li>
              <li>Content you post: forum posts, messages, listings, reviews</li>
              <li>Technical data: device and browser type, IP address, pages viewed, and error logs</li>
              <li>Seller verification data where you sell: identity and business details</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">3. Why we use it</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>To run your account, process orders, take payments and issue refunds</li>
              <li>To prevent fraud, enforce the Terms, and keep the platform safe</li>
              <li>To meet legal, tax and accounting duties</li>
              <li>To send service messages about your orders and account, and marketing only if you opted in</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">4. Who we share it with</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">We share data only as needed with payment gateways, logistics carriers, identity-verification and email providers acting for us under contract, with the seller of an order you place, and with authorities when the law requires it. We do not sell personal data.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">5. Cross-border transfers</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Our providers may process data in countries other than your own. Where we transfer data abroad we do so in line with the Digital Personal Data Protection Act, 2023, and use providers that commit to appropriate safeguards.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">6. How long we keep it</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">We keep account data while your account is open, and order and tax records for as long as the law requires. Afterwards we delete or anonymise it.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">7. Your rights</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">You may ask to access, correct, or delete your personal data, withdraw consent, or nominate someone to exercise these rights for you. Email legal@baalvion.com; we respond within 30 days. If we have not resolved your concern, you may complain to the Data Protection Board of India.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">8. Cookies</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">We use cookies that are needed to keep you signed in and to keep the cart working. Where we use analytics cookies, they measure traffic in aggregate.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">9. Security</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Traffic is encrypted in transit, passwords are hashed, and access to personal data is limited to staff who need it. No system is perfectly secure, so use a strong, unique password.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">10. Children</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">The platform is for people aged 18 and over. We do not knowingly collect data from children, and will delete it if we learn we have.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">11. Changes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">If we change this policy materially, we will say so on the site before the change takes effect.</p>
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
