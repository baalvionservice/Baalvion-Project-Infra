import type { Community } from "@/lib/api/community"
import type { BoardGroup } from "@/components/forums/xen-category-table"

export const groupSlug = (title: string) => title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

// Boards arrive in display order; groups keep the order of their first board.
export function groupBoards(all: Community[]): BoardGroup[] {
  const groups = new Map<string, BoardGroup>()
  for (const c of all.filter((x) => x.isForum)) {
    const title = c.group || "More communities"
    const slug = groupSlug(title)
    if (!groups.has(slug)) groups.set(slug, { slug, title, boards: [] })
    groups.get(slug)!.boards.push(c)
  }
  return [...groups.values()]
}
