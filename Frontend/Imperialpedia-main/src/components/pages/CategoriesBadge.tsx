import { NewsCategory } from "@/lib/data.news";
import { CATEGORY_COLORS } from "@/lib/utils/categories-colors";

export function CategoryBadge({ category, label }: { category: NewsCategory; label?: string }) {
  return (
    <span
      className={`inline-block text-sm font-bold uppercase tracking-wide px-2.5 py-1 rounded ${CATEGORY_COLORS[category]}`}
    >
      {label ?? category}
    </span>
  );
}
