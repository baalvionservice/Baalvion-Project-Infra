"use client";

import { useState } from "react";
import { AdSenseUnit } from "@/components/common/AdSense";

/**
 * AdSenseUnit wrapped in a bordered, labeled card — without this, an unfilled
 * slot (common outside prod, and not unheard of in prod) is just blank empty
 * space with no visual explanation, which reads as a layout bug rather than
 * an ad. Framing it like this keeps the page looking intentional either way.
 *
 * The border/label itself must collapse along with the ad it labels — a
 * bordered "ADVERTISEMENT" box with nothing inside (guaranteed while the
 * AdSense account is unapproved) reads as ad-stuffed empty chrome, not an
 * intentional layout.
 */
export function LabeledAdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  const [filled, setFilled] = useState<boolean | null>(null);

  if (filled === false) return null;

  return (
    <div className={`rounded-lg border border-border p-3 ${className}`}>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        Advertisement
      </p>
      <AdSenseUnit slot={slot} format="auto" responsive={true} onFilledChange={setFilled} />
    </div>
  );
}
