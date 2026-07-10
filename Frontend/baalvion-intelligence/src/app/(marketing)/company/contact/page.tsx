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
      <div className="mx-auto mt-10 max-w-lg">
        <ContactForm />
      </div>
    </div>
  );
}
