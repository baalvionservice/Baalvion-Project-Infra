import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { COUNTRIES } from '@/lib/mock-data';

type PageProps = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const country = COUNTRIES[(await params).country] || COUNTRIES.us;
  return {
    title: "Payments & International Transactions | AMARISÉ MAISON " + country.name,
    description: "How payments to Amarisé Maison Avenue work: who processes them, which currencies apply, and what happens with taxes, failures and chargebacks.",
  };
}

export default async function PaymentsPage({ params }: PageProps) {
  const countryCode = (await params).country || 'us';
  const country = COUNTRIES[countryCode] || COUNTRIES.us;

  return (
    <div className="animate-fade-in bg-white min-h-screen">
      <div className="container mx-auto px-6 py-24 max-w-3xl">
        <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-10">
          <Link href={`/${countryCode}`} className="hover:text-plum transition-colors">Maison</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-plum">Payments &amp; International Transactions</span>
        </div>

        <h1 className="text-5xl font-headline font-bold italic tracking-tight mb-3">Payments &amp; International Transactions</h1>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">
          Storefront: {country.name} · Last updated October 4, 2026
        </p>
        <p className="text-md text-gray-600 font-light leading-relaxed mb-16">How payments to Amarisé Maison Avenue work: who processes them, which currencies apply, and what happens with taxes, failures and chargebacks.</p>

        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">1. Who you are paying</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Payments for Amarisé Maison Avenue are collected by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), registered in India. The name on your bank or card statement may show the payment gateway&apos;s name alongside ours.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">2. How payments are processed</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Payments are taken through third-party payment gateways: PayU, Razorpay and Cashfree for card, UPI and net-banking payments, and Skydo for receiving international payments by bank transfer. The gateway used for your payment is shown at checkout. Card, UPI and net-banking details are entered on the gateway&apos;s hosted payment page or secure fields and are handled under PCI DSS by the gateway. We never see or store your full card number, CVV or banking password.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">3. Payment methods</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Credit and debit cards (Visa, Mastercard, American Express)</li>
              <li>UPI and net banking for deliveries in India</li>
              <li>Bank transfer for high-value and private-client orders, confirmed by our concierge</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">4. Currencies and international payments</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Prices are shown in the currency of the country storefront you are browsing. Your order is charged in that currency at the rate displayed at checkout.</p>
            <p className="text-md text-gray-600 font-light leading-relaxed">If you pay with a card issued outside India, or in a currency other than the one shown, your card network and issuing bank set the conversion rate and may add a foreign-exchange or cross-border fee. These fees are charged by them, not by us, and are not refundable by us.</p>
            <p className="text-md text-gray-600 font-light leading-relaxed">International customers can pay by card through the gateways above, or by international bank transfer collected through Skydo. Funds are received into our Indian bank account through authorised payment channels. Where a gateway or bank requires purpose-of-payment information, we supply it truthfully from the invoice.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">4A. Taxes</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Goods and Services Tax (GST) is charged on supplies where Indian law requires it and is shown on the invoice. Customers outside India are responsible for any import duty, VAT, customs charge or withholding tax that their own country imposes, unless the checkout page says we have collected it.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">5. Failed and pending payments</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>If money has left your account but the order or plan is not confirmed, wait 30 minutes: most confirmations arrive late because of bank or network delays.</li>
              <li>If it is still unresolved, email billing@baalvion.com with the transaction ID and the date. The gateway returns an unconfirmed debit to your original payment method, normally within 5 to 7 business days.</li>
              <li>A payment we cannot match to an order is refunded in full rather than held.</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">6. Refunds</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Refunds go back to the original payment method only. The eligibility rules are in our Refund &amp; Cancellation Policy. Once we approve a refund, the time it takes to appear depends on the gateway and your bank, typically 5 to 10 business days.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">7. Chargebacks and disputes</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Please contact us before raising a chargeback; most billing problems are fixed faster directly. If a chargeback is raised, we give the gateway the order record, delivery proof and correspondence. An account with an unresolved chargeback may be restricted until the dispute closes.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">8. Verification, sanctions and fraud prevention</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">We may ask for identity or business verification (KYC/KYB) before accepting a payment or releasing a service, and we may decline or reverse transactions we reasonably believe are fraudulent, unlawful, or connected to a sanctioned person, entity or territory. We do not accept payments for prohibited goods or services.</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">9. Contact</h2>
            <ul className="list-disc pl-6 space-y-2 text-md text-gray-600 font-light leading-relaxed">
              <li>Billing: billing@baalvion.com</li>
              <li>Support: support@baalvion.com</li>
              <li>Phone: +91 89512 84770</li>
              <li>Complaints: see our Grievance Redressal page</li>
            </ul>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-widest text-gray-900">Operator</h2>
            <p className="text-md text-gray-600 font-light leading-relaxed">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479, GSTIN 21AANCB3490M1ZF. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
