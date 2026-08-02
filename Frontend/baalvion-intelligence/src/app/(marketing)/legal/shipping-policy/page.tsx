import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery Policy",
  description: "How access to Baalvion Intelligence is delivered after purchase.",
};

export default function ShippingPolicyPage() {
  return (
    <article className="section-container section-y max-w-3xl">
      <span className="eyebrow">Legal</span>
      <h1>Shipping & Delivery Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: August 2, 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-2xl">Digital delivery only</h2>
          <p>
            Baalvion Intelligence is a software-as-a-service API — there is no physical product and
            nothing is shipped. Every plan is delivered digitally as an API key and an associated
            request quota on your account.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Delivery time</h2>
          <p>
            Free-plan access is available immediately after sign-up. Paid-plan upgrades are applied
            automatically once Razorpay confirms your payment — typically within a minute of
            checkout, worldwide, with no regional restrictions or delivery fees.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Access issues</h2>
          <p>
            If a purchase completes but your plan doesn&apos;t reflect the upgrade within 15 minutes,
            email <span className="font-medium text-foreground">billing@baalvion.com</span> with your
            payment reference and we&apos;ll resolve it promptly.
          </p>
        </section>
      </div>
    </article>
  );
}
