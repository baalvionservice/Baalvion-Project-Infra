import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Baalvion Intelligence collects, uses, and protects data.",
};

export default function PrivacyPage() {
  return (
    <article className="section-container section-y max-w-3xl">
      <span className="eyebrow">Legal</span>
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: July 10, 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-2xl">Data we collect</h2>
          <p>
            We collect account information (name, email, organization), API usage metadata
            (request counts, endpoints called, timestamps), and billing information processed by
            our payment provider. We do not sell personal data to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Data we index</h2>
          <p>
            The news content we index and serve through the API is sourced from public news
            publishers, official press releases, and licensed feeds. Article text and metadata are
            attributed to their original source in every API response.
          </p>
        </section>
        <section>
          <h2 className="text-2xl">Your rights</h2>
          <p>
            You may request a copy of your account data or deletion of your account at any time by
            contacting <span className="font-medium text-foreground">privacy@baalvion.com</span>.
          </p>
        </section>
      </div>
    </article>
  );
}
