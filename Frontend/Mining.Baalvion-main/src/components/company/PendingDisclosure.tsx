import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PendingDisclosureProps {
  /** Optional override text. Defaults to the standard disclosure notice. */
  label?: string;
  /** Renders a smaller inline variant when true. */
  inline?: boolean;
  className?: string;
}

/**
 * Tasteful muted badge/callout used wherever a real corporate value is not yet
 * publicly available. Renders the literal notice "Information pending company
 * disclosure." (or a provided override) so the site never fabricates data.
 */
export function PendingDisclosure({
  label = "Information pending company disclosure.",
  inline = false,
  className,
}: PendingDisclosureProps) {
  if (inline) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground",
          className
        )}
      >
        <Clock className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3",
        className
      )}
      role="note"
    >
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
