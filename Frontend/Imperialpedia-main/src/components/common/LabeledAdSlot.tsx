import { AdSenseUnit } from "@/components/common/AdSense";

/**
 * AdSenseUnit wrapped in a bordered, labeled card — without this, an unfilled
 * slot (common outside prod, and not unheard of in prod) is just blank empty
 * space with no visual explanation, which reads as a layout bug rather than
 * an ad. Framing it like this keeps the page looking intentional either way.
 */
export function LabeledAdSlot({ slot, className = "" }: { slot: string; className?: string }) {
  return (
    <div className={`rounded-lg border border-border p-3 ${className}`}>
      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        Advertisement
      </p>
      <AdSenseUnit slot={slot} format="auto" responsive={true} />
    </div>
  );
}
