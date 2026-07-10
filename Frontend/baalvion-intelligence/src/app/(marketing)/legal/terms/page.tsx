import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the Baalvion Intelligence API and dashboard.",
};

export default function TermsPage() {
  return (
    <article className="section-container section-y max-w-3xl">
      <span className="eyebrow">Legal</span>
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: July 10, 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-2xl">Use of the API</h2>
          <p>
            Your use of the Baalvion Intelligence API is subject to the request quota of your
            plan. Automated abuse, quota circumvention, or reselling raw API responses as a
            competing data product without a written agreement is prohibited.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Attribution</h2>
          <p>
            When displaying article content or summaries derived from our API in a public product,
            you must retain the source attribution included in the response payload.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Service level</h2>
          <p>
            Uptime targets and support response times for Pro and Enterprise plans are defined in
            your order form or enterprise agreement.
          </p>
        </section>
      </div>
    </article>
  );
}
