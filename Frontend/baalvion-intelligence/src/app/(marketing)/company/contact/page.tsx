import type { Metadata } from "next";

import { ContactForm } from "./contact-form";
import { legalEntity } from "@/lib/legal-entity";

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
            <a href={`mailto:${legalEntity.supportEmail}`} className="font-medium text-foreground hover:underline">
              {legalEntity.supportEmail}
            </a>
          </p>
          <p className="mt-1">
            Phone:{" "}
            <a href={`tel:${legalEntity.phone.replace(/\s+/g, "")}`} className="font-medium text-foreground hover:underline">
              {legalEntity.phone}
            </a>
          </p>
          <p className="mt-1">
            We serve customers worldwide and respond to every message within one business day.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="glow-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground">Registered Office</h3>
            <p className="mt-2 text-sm text-muted-foreground">{legalEntity.registeredOffice}</p>
          </div>
          <div className="glow-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground">Investor Relations Office</h3>
            <p className="mt-2 text-sm text-muted-foreground">{legalEntity.investorRelationsOffice}</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {legalEntity.name} &middot; CIN: {legalEntity.cin} &middot; Incorporated {legalEntity.incorporatedOn}
        </p>
      </div>
    </div>
  );
}
