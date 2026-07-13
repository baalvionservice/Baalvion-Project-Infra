import { Star } from "lucide-react";

type Props = {
  /** A real editorial score (e.g. ReviewArticle provider.overallScore) — never a placeholder. */
  score: number;
  max?: number;
  size?: "sm" | "md";
};

/** Renders a real numeric score (0–5) as filled/half/empty stars. Only ever
 * pass an actual score from review data — this component doesn't invent one. */
export function StarRating({ score, max = 5, size = "sm" }: Props) {
  const dim = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const stars = Array.from({ length: max }, (_, i) => {
    const fill = Math.max(0, Math.min(1, score - i));
    return (
      <span key={i} className="relative inline-block">
        <Star className={`${dim} text-gray-200`} fill="currentColor" />
        {fill > 0 && (
          <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
            <Star className={`${dim} text-amber-500`} fill="currentColor" />
          </span>
        )}
      </span>
    );
  });

  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center gap-0.5">{stars}</span>
      <span className="text-xs font-bold text-foreground">{score.toFixed(1)}/5</span>
    </span>
  );
}

export default StarRating;
