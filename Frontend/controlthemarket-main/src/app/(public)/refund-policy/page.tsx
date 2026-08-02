'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RefundPolicyPage() {
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
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Refund Policy</h1>
            <p className="mt-4 text-lg text-muted-foreground">Return & Refund Guidelines</p>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-6 py-8 border-t border-border">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Refund Policy</h2>
              <p className="mt-4 text-foreground/80">
                We want you to be completely satisfied with your purchase. If for any reason you are not satisfied, we offer a hassle-free refund policy.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Subscription Refunds</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Refunds available within 7 days of purchase for unused subscriptions</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Full refund if service features have not been actively utilized</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Partial refund for subscriptions partially completed (prorated)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">No refund available after 7 days from the date of purchase</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Refunds credited to original payment method within 5-7 business days</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">How to Request a Refund</h3>
              <ol className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">1.</span>
                  <span className="text-foreground/80">Contact our support team at <a href="mailto:support@controlthemarket.com" className="text-primary underline">support@controlthemarket.com</a></span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">2.</span>
                  <span className="text-foreground/80">Include your invoice number and email address associated with your account</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">3.</span>
                  <span className="text-foreground/80">Clearly explain your reason for requesting a refund</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">4.</span>
                  <span className="text-foreground/80">Receive a response from our support team within 48 hours</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Non-Refundable Items</h3>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Custom evaluations and personalized assessments (after completion)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Completed services and delivered outputs</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Consulting and advisory fees</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary">•</span>
                  <span className="text-foreground/80">Payments made after the 7-day refund window</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground">Refund Status</h3>
              <p className="mt-4 text-foreground/80">
                Once your refund request is approved, you can track the status of your refund in your account dashboard under "Billing & Payments". The refund will be processed to your original payment method.
              </p>
            </div>

            <div className="mt-8 rounded-lg bg-primary/5 border border-primary/10 p-4">
              <p className="text-sm text-foreground/80">
                <strong>Questions about our refund policy?</strong> Contact us at{' '}
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
