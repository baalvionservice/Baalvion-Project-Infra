import type { Metadata } from "next";

import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Baalvion Intelligence team about sales, partnerships, or support.",
};

export default function ContactPage() {
  return (
    <div className="section-container section-y">
      <div className="mx-auto max-w-lg text-center">
        <span className="eyebrow mx-auto w-fit justify-center">Contact</span>
        <h1>Talk to the team</h1>
        <p>Sales, partnerships, enterprise SLAs, or just questions — we read every message.</p>
      </div>
      <div className="mx-auto mt-10 max-w-lg space-y-6">
        <ContactForm />
        <div className="glow-card rounded-xl p-6 text-center text-sm text-muted-foreground">
          <p>
            General & billing support:{" "}
            <a href="mailto:support@baalvion.com" className="font-medium text-foreground hover:underline">
              support@baalvion.com
            </a>
          </p>
          <p className="mt-1">
            We serve customers worldwide and respond to every message within one business day.
          </p>
        </div>
      </div>
    </div>
  );
}
