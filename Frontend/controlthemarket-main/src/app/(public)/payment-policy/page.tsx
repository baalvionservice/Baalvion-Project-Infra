'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/5">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back home
          </Button>
        </Link>

        <article className="prose prose-sm dark:prose-invert max-w-none">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Payment Policy</h1>
            <p className="mt-4 text-lg text-muted-foreground">Payment Methods, Security & Processing</p>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-6 py-8 border-t border-border">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Payment Policy</h2>
              <p className="mt-4 text-foreground/80">
                This Payment Policy describes how ControlTheMarket processes payments, protects your financial information, and manages transactions securely.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Accepted Payment Methods</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Credit & Debit Cards:</strong> Visa, Mastercard, American Express</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>UPI:</strong> Google Pay, PhonePe, Paytm, BHIM</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Net Banking:</strong> All major Indian banks</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Digital Wallets:</strong> Razorpay, Cashfree, PayU</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Bank Transfers:</strong> Direct NEFT/IMPS</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Payment Security</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">🔒</span>
                  <span className="text-foreground/80"><strong>SSL/TLS Encryption:</strong> All transactions encrypted in transit with industry-standard protocols</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">🔒</span>
                  <span className="text-foreground/80"><strong>PCI-DSS Level 1 Compliant:</strong> Highest security standard for payment processing</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">🔒</span>
                  <span className="text-foreground/80"><strong>No Card Storage:</strong> Payment details never stored on our servers</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">🔒</span>
                  <span className="text-foreground/80"><strong>Third-Party Gateways:</strong> Payments processed by Stripe, Razorpay, PayU, and Cashfree — industry leaders</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">🔒</span>
                  <span className="text-foreground/80"><strong>Tokenization:</strong> Cards tokenized for recurring billing without retransmitting card data</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Payment Processing Steps</h3>
              <ol className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">1.</span>
                  <span className="text-foreground/80">You initiate payment in the checkout</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">2.</span>
                  <span className="text-foreground/80">Redirected to secure payment gateway (Stripe/Razorpay/etc.)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">3.</span>
                  <span className="text-foreground/80">Complete payment details on gateway (not on our servers)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">4.</span>
                  <span className="text-foreground/080">Gateway verifies payment with your bank</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">5.</span>
                  <span className="text-foreground/80">Confirmation sent to you via email and SMS</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">6.</span>
                  <span className="text-foreground/80">Subscription activated immediately</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">7.</span>
                  <span className="text-foreground/80">Invoice generated and available in your dashboard</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Failed Payments</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Automatic retry scheduled within 24 hours</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Notification sent via email and SMS with failure reason</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Manual retry available in Billing dashboard</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Update payment method and try again</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Contact support if issue persists after 48 hours</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Currency & Taxation</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Supported Currencies:</strong> USD, INR, GBP, EUR</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>GST/Taxes:</strong> Calculated and included in final amount (India)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Invoice:</strong> Detailed invoice provided with tax breakdown</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80"><strong>Exchange Rates:</strong> Real-time rates from payment gateway</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Recurring Billing</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Automatic renewal on subscription anniversary date</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Email reminder sent 7 days before renewal</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Charge will be made on the registered card</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Cancel anytime from dashboard (no questions asked)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Billing Disputes</h3>
              <p className="mt-4 text-foreground/80">
                If you notice an unauthorized or incorrect charge:
              </p>
              <ol className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">1.</span>
                  <span className="text-foreground/80">Contact us at <a href="mailto:billing@controlthemarket.com" className="text-primary underline">billing@controlthemarket.com</a> within 30 days</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">2.</span>
                  <span className="text-foreground/80">Provide invoice number and description of dispute</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">3.</span>
                  <span className="text-foreground/80">We investigate and respond within 5 business days</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">4.</span>
                  <span className="text-foreground/80">If approved, refund issued within 7 days</span>
                </li>
              </ol>
            </div>

            <div className="mt-8 rounded-lg bg-primary/5 border border-primary/10 p-4">
              <p className="text-sm text-foreground/80">
                <strong>Payment questions?</strong> Contact us at{' '}
                <a href="mailto:support@controlthemarket.com" className="text-primary underline">
                  support@controlthemarket.com
                </a>
              </p>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
