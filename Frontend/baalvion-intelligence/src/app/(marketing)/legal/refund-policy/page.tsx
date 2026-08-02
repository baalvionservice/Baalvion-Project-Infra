import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Refund and cancellation terms for Baalvion Intelligence paid plans.",
};

export default function RefundPolicyPage() {
  return (
    <article className="section-container section-y max-w-3xl">
      <span className="eyebrow">Legal</span>
      <h1>Refund & Cancellation Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: August 2, 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-2xl">How billing works</h2>
          <p>
            Paid plans (Starter, Growth, Pro) are billed as a one-time charge that unlocks that
            plan&apos;s request quota — there is no recurring subscription or auto-renewal. Nothing is
            charged again automatically; you return to purchase the next period&apos;s quota when
            you&apos;re ready.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Cancellation</h2>
          <p>
            Because there is no recurring charge, there is nothing to cancel. The Free plan
            (100 requests/day) remains available at no cost at any time.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Refunds</h2>
          <p>
            If you&apos;re not satisfied with a paid plan, contact{" "}
            <span className="font-medium text-foreground">billing@baalvion.com</span> within 7 days
            of purchase. We issue a full refund to your original payment method, processed by
            Razorpay, provided your usage on that purchase has not exceeded the equivalent of the
            Free plan&apos;s daily quota. Refunds are typically credited within 5-7 business days,
            depending on your bank or card issuer.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Failed or duplicate charges</h2>
          <p>
            If a payment is deducted but your plan is not upgraded (for example, a webhook delivery
            delay), it resolves automatically within a few minutes. If it doesn&apos;t, email{" "}
            <span className="font-medium text-foreground">billing@baalvion.com</span> with your
            payment reference and we&apos;ll fix it or refund it — whichever you prefer.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Enterprise agreements</h2>
          <p>
            Custom Enterprise contracts are governed by the refund and termination terms in the
            signed order form, which take precedence over this page.
          </p>
        </section>
      </div>
    </article>
  );
}
