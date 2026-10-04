import type { Metadata } from 'next';
import { Footer } from '@/components/layout/footer';

export const metadata: Metadata = {
  title: "Payments & International Transactions",
  description: "Payments & International Transactions — Market Underworld Community, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/payments" },
};

export default function PaymentsPage() {
  return (
    <>
    <main className="min-h-screen bg-[#0B0C0F] text-white">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#39FF14]">Legal</p>
        <h1 className="mt-3 text-4xl font-bold uppercase tracking-tight font-display">Payments &amp; International Transactions</h1>
        <p className="mt-3 text-sm text-[#9CA3AF]">How payments to the Market Underworld Community marketplace (community.marketunderworld.com) work: who processes them, which currencies apply, and what happens with taxes, failures and chargebacks.</p>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#6B7280]">Last updated: October 4, 2026</p>
        <div className="mt-12 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">1. Who you are paying</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Payments for the Market Underworld Community marketplace (community.marketunderworld.com) are collected by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), registered in India. The name on your bank or card statement may show the payment gateway&apos;s name alongside ours.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">2. How payments are processed</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Payments are taken through third-party payment gateways: PayU, Razorpay and Cashfree for card, UPI and net-banking payments, and Skydo for receiving international payments by bank transfer. The gateway used for your payment is shown at checkout. Card, UPI and net-banking details are entered on the gateway&apos;s hosted payment page or secure fields and are handled under PCI DSS by the gateway. We never see or store your full card number, CVV or banking password.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">3. Payment methods</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Credit and debit cards (Visa, Mastercard, American Express)</li>
              <li>UPI and net banking for customers in India</li>
              <li>Gift-card and wallet balance held on the platform</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">4. Currencies and international payments</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Listing prices are shown in the currency displayed on the item and at checkout. Where a seller lists in a currency other than yours, the amount charged is shown before you confirm.</p>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">If you pay with a card issued outside India, or in a currency other than the one shown, your card network and issuing bank set the conversion rate and may add a foreign-exchange or cross-border fee. These fees are charged by them, not by us, and are not refundable by us.</p>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">International customers can pay by card through the gateways above, or by international bank transfer collected through Skydo. Funds are received into our Indian bank account through authorised payment channels. Where a gateway or bank requires purpose-of-payment information, we supply it truthfully from the invoice.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">4A. Taxes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Goods and Services Tax (GST) is charged on supplies where Indian law requires it and is shown on the invoice. Customers outside India are responsible for any import duty, VAT, customs charge or withholding tax that their own country imposes, unless the checkout page says we have collected it.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">5. Failed and pending payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>If money has left your account but the order or plan is not confirmed, wait 30 minutes: most confirmations arrive late because of bank or network delays.</li>
              <li>If it is still unresolved, email billing@baalvion.com with the transaction ID and the date. The gateway returns an unconfirmed debit to your original payment method, normally within 5 to 7 business days.</li>
              <li>A payment we cannot match to an order is refunded in full rather than held.</li>
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">6. Refunds</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Refunds go back to the original payment method only. The eligibility rules are in our Refund &amp; Cancellation Policy. Once we approve a refund, the time it takes to appear depends on the gateway and your bank, typically 5 to 10 business days.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">7. Chargebacks and disputes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">Please contact us before raising a chargeback; most billing problems are fixed faster directly. If a chargeback is raised, we give the gateway the order record, delivery proof and correspondence. An account with an unresolved chargeback may be restricted until the dispute closes.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">8. Verification, sanctions and fraud prevention</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">We may ask for identity or business verification (KYC/KYB) before accepting a payment or releasing a service, and we may decline or reverse transactions we reasonably believe are fraudulent, unlawful, or connected to a sanctioned person, entity or territory. We do not accept payments for prohibited goods or services.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-[#1F232B] pb-2">9. Contact</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-[#9CA3AF] leading-relaxed">
              <li>Billing: billing@baalvion.com</li>
              <li>Support: support@baalvion.com</li>
              <li>Phone: +91 89512 84770</li>
              <li>Complaints: see our Grievance Redressal page</li>
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
