import { getTopicColor } from "@/lib/topic-colors";

export function CategoryBadge({ category }: { category: string }) {
  const color = getTopicColor(category);
  return (
    <span
      className="inline-block px-2.5 py-1 text-xs font-bold uppercase tracking-widest rounded-full"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {category}
    </span>
  );
}
