import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Payments & International Transactions",
  description: "Payments & International Transactions — Baalvion Intelligence, operated by Baalvion Industries Private Limited.",
  alternates: { canonical: "/legal/payments" },
};

export default function PaymentsPage() {
  return (
    <article className="section-container section-y max-w-3xl">
      <span className="eyebrow">Legal</span>
      <h1>Payments &amp; International Transactions</h1>
      <p className="text-sm text-muted-foreground">Last updated: October 4, 2026</p>
      <p className="mt-4 text-muted-foreground">How payments to Baalvion Intelligence (signal.baalvion.com) work: who processes them, which currencies apply, and what happens with taxes, failures and chargebacks.</p>
      <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-2xl">1. Who you are paying</h2>
            <p>Payments for Baalvion Intelligence (signal.baalvion.com) are collected by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), registered in India. The name on your bank or card statement may show the payment gateway&apos;s name alongside ours.</p>
          </section>
          <section>
            <h2 className="text-2xl">2. How payments are processed</h2>
            <p>Payments are taken through RBI-authorised payment aggregators and gateways. Card, UPI and net-banking details are entered on the gateway&apos;s hosted payment page or secure fields and are handled under PCI DSS by the gateway. We never see or store your full card number, CVV or banking password.</p>
          </section>
          <section>
            <h2 className="text-2xl">3. Payment methods</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Credit and debit cards (Visa, Mastercard, American Express, RuPay)</li>
              <li>UPI and net banking for customers in India</li>
              <li>Invoice and bank transfer for Enterprise plans</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl">4. Currencies and international payments</h2>
            <p>Plans are priced in US dollars as shown on the pricing page. Customers in India may be charged in Indian rupees at the rate shown at checkout.</p>
            <p>If you pay with a card issued outside India, or in a currency other than the one shown, your card network and issuing bank set the conversion rate and may add a foreign-exchange or cross-border fee. These fees are charged by them, not by us, and are not refundable by us.</p>
            <p>Funds from international customers are received into our Indian bank account through authorised payment channels. Where a gateway or bank requires purpose-of-payment information, we supply it truthfully from the invoice.</p>
          </section>
          <section>
            <h2 className="text-2xl">4A. Taxes</h2>
            <p>Goods and Services Tax (GST) is charged on supplies where Indian law requires it and is shown on the invoice. Customers outside India are responsible for any import duty, VAT, customs charge or withholding tax that their own country imposes, unless the checkout page says we have collected it.</p>
          </section>
          <section>
            <h2 className="text-2xl">5. Failed and pending payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>If money has left your account but the order or plan is not confirmed, wait 30 minutes: most confirmations arrive late because of bank or network delays.</li>
              <li>If it is still unresolved, email billing@baalvion.com with the transaction ID and the date. The gateway returns an unconfirmed debit to your original payment method, normally within 5 to 7 business days.</li>
              <li>A payment we cannot match to an order is refunded in full rather than held.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl">6. Refunds</h2>
            <p>Refunds go back to the original payment method only. The eligibility rules are in our Refund &amp; Cancellation Policy. Once we approve a refund, the time it takes to appear depends on the gateway and your bank, typically 5 to 10 business days.</p>
          </section>
          <section>
            <h2 className="text-2xl">7. Chargebacks and disputes</h2>
            <p>Please contact us before raising a chargeback; most billing problems are fixed faster directly. If a chargeback is raised, we give the gateway the order record, delivery proof and correspondence. An account with an unresolved chargeback may be restricted until the dispute closes.</p>
          </section>
          <section>
            <h2 className="text-2xl">8. Verification, sanctions and fraud prevention</h2>
            <p>We may ask for identity or business verification (KYC/KYB) before accepting a payment or releasing a service, and we may decline or reverse transactions we reasonably believe are fraudulent, unlawful, or connected to a sanctioned person, entity or territory. We do not accept payments for prohibited goods or services.</p>
          </section>
          <section>
            <h2 className="text-2xl">9. Contact</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Billing: billing@baalvion.com</li>
              <li>Support: support@baalvion.com</li>
              <li>Phone: +91 89512 84770</li>
              <li>Complaints: see our Grievance Redressal page</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl">Operator</h2>
            <p className="">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
          </section>
      </div>
    </article>
  );
}
