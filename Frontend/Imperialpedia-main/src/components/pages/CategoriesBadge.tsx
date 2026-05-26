import { NewsCategory } from "@/lib/data.news";
import { CATEGORY_COLORS } from "@/lib/utils/categories-colors";

export function CategoryBadge({ category }: { category: NewsCategory }) {
  return (
    <span
      className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}
    >
      {category}
    </span>
  );
}
