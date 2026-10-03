import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";

export default function PaymentsPage() {
  return (
    <div className="min-h-screen py-20">
      <SEOHead title="Payments & International Transactions" description="How payments to Baalvion NetStack work: who processes them, which currencies apply, and what happens with taxes, failures and chargebacks." />
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Payments &amp; International Transactions</h1>
            <p className="text-muted-foreground">Last updated: October 4, 2026</p>
          </div>

          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Who you are paying</h2>
                <p className="text-muted-foreground mb-4">Payments for Baalvion NetStack are collected by Baalvion Industries Private Limited (CIN U43121OD2025PTC048479), registered in India. The name on your bank or card statement may show the payment gateway&apos;s name alongside ours.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. How payments are processed</h2>
                <p className="text-muted-foreground mb-4">Payments are taken through third-party payment gateways: PayU, Razorpay and Cashfree for card, UPI and net-banking payments, and Skydo for receiving international payments by bank transfer. The gateway used for your payment is shown at checkout. Card, UPI and net-banking details are entered on the gateway&apos;s hosted payment page or secure fields and are handled under PCI DSS by the gateway. We never see or store your full card number, CVV or banking password.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Payment methods</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Credit and debit cards (Visa, Mastercard, American Express)</li>
                  <li>UPI and net banking for customers in India</li>
                  <li>Bank transfer or invoice for Enterprise plans</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Currencies and international payments</h2>
                <p className="text-muted-foreground mb-4">Plans are priced in US dollars as shown on the pricing page. Customers in India may be charged in Indian rupees at the rate shown at checkout.</p>
                <p className="text-muted-foreground mb-4">If you pay with a card issued outside India, or in a currency other than the one shown, your card network and issuing bank set the conversion rate and may add a foreign-exchange or cross-border fee. These fees are charged by them, not by us, and are not refundable by us.</p>
                <p className="text-muted-foreground mb-4">International customers can pay by card through the gateways above, or by international bank transfer collected through Skydo. Funds are received into our Indian bank account through authorised payment channels. Where a gateway or bank requires purpose-of-payment information, we supply it truthfully from the invoice.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4A. Taxes</h2>
                <p className="text-muted-foreground mb-4">Goods and Services Tax (GST) is charged on supplies where Indian law requires it and is shown on the invoice. Customers outside India are responsible for any import duty, VAT, customs charge or withholding tax that their own country imposes, unless the checkout page says we have collected it.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Failed and pending payments</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>If money has left your account but the order or plan is not confirmed, wait 30 minutes: most confirmations arrive late because of bank or network delays.</li>
                  <li>If it is still unresolved, email billing@baalvion.com with the transaction ID and the date. The gateway returns an unconfirmed debit to your original payment method, normally within 5 to 7 business days.</li>
                  <li>A payment we cannot match to an order is refunded in full rather than held.</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Refunds</h2>
                <p className="text-muted-foreground mb-4">Refunds go back to the original payment method only. The eligibility rules are in our Refund &amp; Cancellation Policy. Once we approve a refund, the time it takes to appear depends on the gateway and your bank, typically 5 to 10 business days.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Chargebacks and disputes</h2>
                <p className="text-muted-foreground mb-4">Please contact us before raising a chargeback; most billing problems are fixed faster directly. If a chargeback is raised, we give the gateway the order record, delivery proof and correspondence. An account with an unresolved chargeback may be restricted until the dispute closes.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Verification, sanctions and fraud prevention</h2>
                <p className="text-muted-foreground mb-4">We may ask for identity or business verification (KYC/KYB) before accepting a payment or releasing a service, and we may decline or reverse transactions we reasonably believe are fraudulent, unlawful, or connected to a sanctioned person, entity or territory. We do not accept payments for prohibited goods or services.</p>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Contact</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Billing: billing@baalvion.com</li>
                  <li>Support: support@baalvion.com</li>
                  <li>Phone: +91 89512 84770</li>
                  <li>Complaints: see our Grievance Redressal page</li>
                </ul>
              </section>
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Operator</h2>
                <p className="text-muted-foreground mb-4">Baalvion Industries Private Limited, CIN U43121OD2025PTC048479. Registered office: C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha 764036, India. Operating office: Yeshwant Avenue Building, NX Road, Y K Nagar, Virar West, Virar, Maharashtra 401303, India. Phone +91 89512 84770. Email support@baalvion.com.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
