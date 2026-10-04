import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund & Cancellation Policy — Market Underworld Community, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/refund-policy" },
};

export default function RefundPolicyPage() {
  return (
    <>
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">Legal</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">Refund &amp; Cancellation Policy</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">Cancellation, return and refund terms for orders, memberships and classes on the Market Underworld Community.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">Last updated: October 4, 2026</p>
        <div className="mt-12 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">1. Who sells what</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Some items are sold by Baalvion directly and others by independent sellers on the marketplace. This policy applies to all orders. Where a seller&apos;s listing states a longer return window, the longer window applies.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">2. Cancelling an order</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Physical goods can be cancelled before dispatch. Cancel from your orders page or email support@baalvion.com.</li>
              <li>Digital goods and live-session tickets cannot be cancelled after delivery or after the session has started.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">3. Returns of physical goods</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Request a return from the Returns page within 7 days of delivery.</li>
              <li>The item must be unused and in original packaging.</li>
              <li>Returns are approved once the reason is verified. Rejected requests carry a written reason.</li>
              <li>Items that arrive damaged, defective or not as listed are returned at no cost to you.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">4. Memberships and subscriptions</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Cancel any time from Subscriptions; the next renewal stops and access continues to the end of the paid period.</li>
              <li>A first-time purchase can be refunded in full within 7 days if the membership benefits have not been used.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">5. Education classes and live sessions</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>A class or session cancelled by the teacher or by us is refunded in full automatically.</li>
              <li>If you cancel at least 48 hours before a scheduled live session, you are refunded in full.</li>
              <li>Recorded or downloadable course content is refundable within 7 days if less than 20% has been viewed.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">6. Gift cards and wallet balance</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Gift cards are not refundable for cash once issued, except where the law requires, but unused balance remains valid until the expiry date shown on the card.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">7. Refunds</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Approved refunds are issued within 5 to 7 business days to the original payment method. If a seller does not complete a refund we have approved, we pay it and recover it from the seller.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">8. Non-refundable</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Consumed digital goods and tickets for sessions already attended</li>
              <li>Orders cancelled for breach of the Terms of Service</li>
              <li>Shipping paid on a return that was your change of mind</li>
            </ul>
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
