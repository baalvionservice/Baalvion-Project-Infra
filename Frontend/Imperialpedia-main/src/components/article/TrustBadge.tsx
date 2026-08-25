import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/** Links to the site's real, published editorial/fact-checking policies —
 *  general standards this content follows, not a per-article claim (the
 *  byline's own "Reviewed by" / "Fact checked by" lines cover that when a
 *  specific reviewer is on record). */
export function TrustBadge() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1 font-semibold text-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Editorially independent
      </span>
      <Link href="/editorial-policy" className="hover:text-primary hover:underline">
        Our editorial policy
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/fact-checking" className="hover:text-primary hover:underline">
        How we fact-check
      </Link>
    </div>
  );
}
