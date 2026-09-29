import { UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ExecutiveProfile {
  /** Stable key for list rendering. */
  id: string;
  /** Role or function placeholder, e.g. "Executive Leadership". */
  role: string;
  /**
   * When true, the card renders a neutral silhouette and a "Profile information
   * coming soon" note instead of any (non-existent) personal details. No real
   * names, photos, or credentials are ever fabricated.
   */
  comingSoon?: boolean;
  className?: string;
}

/**
 * Renders a single leadership slot. Because no real executives are publicly
 * disclosed, every card is a respectful placeholder marked "coming soon".
 */
export function ExecutiveProfileCard({ role, comingSoon = true, className }: ExecutiveProfile) {
  return (
    <Card className={cn("border-border/60 shadow-sm transition-shadow hover:shadow-md", className)}>
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full bg-muted ring-1 ring-border"
          aria-hidden="true"
        >
          <UserRound className="h-12 w-12 text-muted-foreground/50" />
        </div>

        <div className="space-y-1">
          <p className="text-base font-bold text-primary">{role}</p>
          {comingSoon && (
            <Badge variant="secondary" className="font-medium">
              Profile information coming soon
            </Badge>
          )}
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Detailed biography and credentials will be published as part of our
          corporate disclosure.
        </p>
      </CardContent>
    </Card>
  );
}
