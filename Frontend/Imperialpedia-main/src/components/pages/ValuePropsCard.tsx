import { Globe2, BarChart3, GraduationCap, TrendingUp } from "lucide-react";
import { getTopicColor } from "@/lib/topic-colors";

const VALUE_PROPS = [
  { label: "Comprehensive industry coverage", icon: Globe2 },
  { label: "Data-driven insights", icon: BarChart3 },
  { label: "Expert knowledge", icon: GraduationCap },
  { label: "Stay ahead of the curve", icon: TrendingUp },
];

/**
 * Right-rail companion to ArticleSidebar on topic hub pages — what the reader
 * gets by sticking around. Opt-in per page via CategoryFeed's `rightRail` prop,
 * same rollout pattern as `sidebar`. The newsletter pitch itself lives in the
 * full-width WeeklyDigestSignup banner below the feed, matching article pages.
 */
export function ValuePropsCard({ categoryLabel }: { categoryLabel: string }) {
  const color = getTopicColor(categoryLabel);

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-lg border border-border border-t-4 p-5" style={{ borderTopColor: color }}>
        <h2 className="mb-4 text-xs font-black uppercase tracking-widest" style={{ color }}>
          Why Imperialpedia
        </h2>
        <ul className="space-y-3.5">
          {VALUE_PROPS.map(({ label, icon: Icon }) => (
            <li key={label} className="flex items-start gap-2.5 text-sm font-semibold text-foreground">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export default ValuePropsCard;
