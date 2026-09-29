import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Terms &amp; Conditions</h1>
            <p className="text-muted-foreground">Last updated: June 15, 2026</p>
          </div>

          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
                <p className="text-muted-foreground mb-4">
                  These Terms &amp; Conditions ("Terms") govern your access to and use of the Baalvion
                  NetStack proxy infrastructure, dashboards, APIs, and related services (collectively,
                  the "Service") provided by Baalvion Industries Private Limited ("Baalvion", "we",
                  "us"). By creating an account, purchasing a plan, or otherwise using the Service, you
                  agree to be bound by these Terms. If you do not agree, do not use the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
                <p className="text-muted-foreground mb-4">
                  You must be at least 18 years old and able to form a binding contract. If you use the
                  Service on behalf of an organization, you represent that you are authorized to bind
                  that organization to these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Accounts &amp; Security</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>You are responsible for the accuracy of your registration information.</li>
                  <li>You are responsible for safeguarding your credentials and API keys.</li>
                  <li>You are responsible for all activity that occurs under your account.</li>
                  <li>Notify us immediately of any unauthorized use at security@baalvion.com.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">
                  Your use of the Service is subject to our{" "}
                  <a href="/aup" className="text-primary hover:underline">Acceptable Use Policy</a>.
                  You may not use the Service for any unlawful, fraudulent, or abusive activity,
                  including unauthorized access to systems, distribution of malware, or infringement of
                  third-party rights. We may suspend or terminate accounts that violate the AUP.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Plans, Fees &amp; Billing</h2>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>
                    Prices are listed on our{" "}
                    <a href="/pricing" className="text-primary hover:underline">Pricing</a> page and are
                    charged in <strong>US Dollars (USD)</strong> unless stated otherwise. International
                    cards are accepted; your bank performs any currency conversion at its own rate.
                  </li>
                  <li>Paid plans renew automatically each billing cycle until cancelled.</li>
                  <li>Pay-As-You-Go usage is drawn down from prepaid credit and is non-refundable once consumed.</li>
                  <li>Applicable taxes may be added at checkout based on your billing location.</li>
                  <li>You authorize us and our payment processors to charge your selected payment method.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Payment Processing</h2>
                <p className="text-muted-foreground mb-4">
                  Payments are handled by third-party payment processors (such as Razorpay, PayU,
                  Cashfree, and Stripe). Card details are entered on the processor's secure, hosted
                  pages — Baalvion never stores your full card number or CVV. Your use of a processor is
                  subject to that processor's own terms and privacy policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Refunds &amp; Cancellation</h2>
                <p className="text-muted-foreground mb-4">
                  Refunds are governed by our{" "}
                  <a href="/refund" className="text-primary hover:underline">Refund Policy</a>. You may
                  cancel a subscription at any time; cancellation stops future billing and access
                  continues until the end of the current billing period.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Service Availability &amp; SLA</h2>
                <p className="text-muted-foreground mb-4">
                  We strive for high availability and publish service targets in our{" "}
                  <a href="/sla" className="text-primary hover:underline">SLA</a>. The Service is
                  provided on a commercially reasonable-effort basis; scheduled maintenance and factors
                  outside our control may affect availability.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Intellectual Property</h2>
                <p className="text-muted-foreground mb-4">
                  The Service, including all software, branding, and content, is owned by Baalvion and
                  protected by intellectual-property laws. We grant you a limited, non-exclusive,
                  non-transferable right to use the Service in accordance with these Terms. You retain
                  ownership of data you lawfully process through the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">10. Privacy</h2>
                <p className="text-muted-foreground mb-4">
                  Our handling of personal data is described in our{" "}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> and{" "}
                  <a href="/cookies" className="text-primary hover:underline">Cookie Policy</a>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">11. Disclaimers</h2>
                <p className="text-muted-foreground mb-4">
                  The Service is provided "as is" and "as available" without warranties of any kind,
                  whether express or implied, including merchantability, fitness for a particular
                  purpose, and non-infringement, to the maximum extent permitted by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
                <p className="text-muted-foreground mb-4">
                  To the maximum extent permitted by law, Baalvion shall not be liable for any indirect,
                  incidental, special, consequential, or punitive damages, or any loss of profits or
                  data. Our aggregate liability for any claim arising out of the Service shall not
                  exceed the amount you paid to us in the three (3) months preceding the claim.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">13. Indemnification</h2>
                <p className="text-muted-foreground mb-4">
                  You agree to indemnify and hold Baalvion harmless from any claims, damages, or
                  expenses arising from your use of the Service or your violation of these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">14. Termination</h2>
                <p className="text-muted-foreground mb-4">
                  We may suspend or terminate your access for violation of these Terms, the AUP, or for
                  non-payment. Upon termination, your right to use the Service ceases. Sections that by
                  their nature should survive termination (e.g., fees owed, IP, liability) will survive.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">15. Changes to These Terms</h2>
                <p className="text-muted-foreground mb-4">
                  We may update these Terms from time to time. Material changes will be posted on this
                  page with an updated "Last updated" date. Continued use of the Service after changes
                  take effect constitutes acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">16. Governing Law</h2>
                <p className="text-muted-foreground mb-4">
                  These Terms are governed by the laws of India, without regard to conflict-of-laws
                  principles. Disputes shall be subject to the exclusive jurisdiction of the competent
                  courts where Baalvion is registered.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">17. Contact Us</h2>
                <p className="text-muted-foreground mb-4">For questions about these Terms:</p>
                <div className="bg-secondary/30 rounded-lg p-4 text-muted-foreground">
                  <p>Baalvion Industries Private Limited</p>
                  <p>Email: legal@baalvion.com</p>
                  <p>Support: support@baalvion.com</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
