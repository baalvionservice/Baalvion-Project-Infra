import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Legal
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 24, 2024
            </p>
          </div>

          {/* Quick Summary */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-success/10 border-success/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-success mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Eligible for Refund
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Within 7 days of purchase</li>
                  <li>• Less than 10% bandwidth used</li>
                  <li>• Technical issues on our end</li>
                  <li>• Service not as described</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10 border-destructive/20">
              <CardContent className="p-6">
                <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
                  <X className="w-5 h-5" />
                  Not Eligible for Refund
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• After 7 days from purchase</li>
                  <li>• More than 10% bandwidth used</li>
                  <li>• Account terminated for AUP violation</li>
                  <li>• Change of mind after trial period</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <Card className="bg-card/50">
            <CardContent className="p-8 md:p-12 prose prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
                <p className="text-muted-foreground mb-4">
                  At Baalvion NetStack, we want you to be completely satisfied with our services. 
                  This Refund Policy outlines the conditions under which we offer refunds for 
                  our proxy services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">2. Money-Back Guarantee</h2>
                <p className="text-muted-foreground mb-4">
                  We offer a 7-day money-back guarantee on all new subscriptions, subject to 
                  the following conditions:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Request must be made within 7 calendar days of initial purchase</li>
                  <li>Less than 10% of purchased bandwidth has been consumed</li>
                  <li>Account is in good standing (no AUP violations)</li>
                  <li>First-time customers only (one refund per customer)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">3. Eligible Refund Scenarios</h2>
                
                <h3 className="text-lg font-semibold mb-2">3.1 Technical Issues</h3>
                <p className="text-muted-foreground mb-4">
                  If you experience persistent technical issues that our support team cannot 
                  resolve within 48 hours, you may be eligible for a full or partial refund, 
                  regardless of usage.
                </p>

                <h3 className="text-lg font-semibold mb-2">3.2 Service Not as Described</h3>
                <p className="text-muted-foreground mb-4">
                  If our service materially differs from the description on our website, 
                  you may request a refund within 14 days of purchase.
                </p>

                <h3 className="text-lg font-semibold mb-2">3.3 Billing Errors</h3>
                <p className="text-muted-foreground mb-4">
                  Duplicate charges or incorrect billing amounts will be refunded in full 
                  upon verification.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">4. Non-Refundable Situations</h2>
                <p className="text-muted-foreground mb-4">
                  Refunds will NOT be provided in the following cases:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Account termination due to AUP violations</li>
                  <li>Requests made after the 7-day guarantee period</li>
                  <li>More than 10% of bandwidth consumed (for money-back guarantee)</li>
                  <li>Dissatisfaction with results achieved using our proxies</li>
                  <li>Third-party website blocks (not within our control)</li>
                  <li>Custom or enterprise plans (contact sales for terms)</li>
                  <li>Promotional or discounted purchases (unless otherwise stated)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">5. Refund Process</h2>
                <h3 className="text-lg font-semibold mb-2">Step 1: Submit Request</h3>
                <p className="text-muted-foreground mb-4">
                  Contact our support team at billing@baalvion.com with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Your account email address</li>
                  <li>Order/Invoice number</li>
                  <li>Reason for refund request</li>
                  <li>Any relevant screenshots or evidence</li>
                </ul>

                <h3 className="text-lg font-semibold mb-2">Step 2: Review</h3>
                <p className="text-muted-foreground mb-4">
                  Our team will review your request within 2 business days and may request 
                  additional information if needed.
                </p>

                <h3 className="text-lg font-semibold mb-2">Step 3: Resolution</h3>
                <p className="text-muted-foreground mb-4">
                  If approved, refunds are processed within 5-10 business days to your 
                  original payment method.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">6. Partial Refunds</h2>
                <p className="text-muted-foreground mb-4">
                  In some cases, we may offer partial refunds based on:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Percentage of bandwidth remaining</li>
                  <li>Days remaining in billing period</li>
                  <li>Severity of technical issues experienced</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">7. Subscription Cancellation</h2>
                <p className="text-muted-foreground mb-4">
                  You may cancel your subscription at any time. Cancellation will:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
                  <li>Stop future billing immediately</li>
                  <li>Allow access until the current billing period ends</li>
                  <li>NOT provide a prorated refund for unused time (unless within guarantee period)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">8. Chargebacks</h2>
                <p className="text-muted-foreground mb-4">
                  We strongly encourage you to contact us before initiating a chargeback. 
                  Chargebacks filed without attempting to resolve the issue with us may 
                  result in permanent account termination and may affect your ability to 
                  use our services in the future.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                <p className="text-muted-foreground mb-4">
                  For refund requests or billing questions:
                </p>
                <div className="bg-secondary/30 rounded-lg p-4 text-muted-foreground">
                  <p>Baalvion Industries Private Limited</p>
                  <p>Email: billing@baalvion.com</p>
                  <p>Support: support@baalvion.com</p>
                  <p>Response Time: Within 24 hours</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
