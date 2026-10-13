import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { getCommunities } from "@/lib/api/community"
import { XenCategoryTable } from "@/components/forums/xen-category-table"
import { groupBoards } from "@/lib/forum-groups"

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const group = groupBoards(await getCommunities()).find((g) => g.slug === slug)
  if (!group) notFound()

  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330]">
          <Link href="/forum" className="hover:text-red-400 flex items-center gap-1"><Home className="w-3.5 h-3.5 text-red-500" /><span>Home</span></Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/forum" className="hover:text-red-400">Forums</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold">{group.title}</span>
        </div>
        <div className="mb-6 pb-4 border-b border-[#232330]">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{group.title}</h1>
          <p className="text-sm text-gray-400 mt-1">Every board in {group.title}. Open one to read and post.</p>
        </div>
        <XenCategoryTable category={group} />
      </div>
    </div>
  )
}
