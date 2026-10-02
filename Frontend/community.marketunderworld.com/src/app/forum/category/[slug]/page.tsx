import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home, Plus } from "lucide-react";
import { FORUM_CATEGORIES } from "@/lib/forum-data";
import { XenCategoryTable } from "@/components/forums/xen-category-table";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Handle slugs with or without numeric suffixes like making-money-and-courses.469147
  const cleanSlug = slug.split(".")[0];
  const category = FORUM_CATEGORIES.find(
    (c) => c.slug === cleanSlug || (c.numericId && slug.includes(c.numericId))
  );

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#06040a] text-[#e8dcc8] pt-24 pb-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* XenForo Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-[#121217] px-4 py-2.5 rounded border border-[#232330]">
          <Link href="/forum" className="hover:text-red-400 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-red-500" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/forum" className="hover:text-red-400">
            Forums
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-gray-200 font-semibold">{category.title}</span>
        </div>

        {/* Category Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232330]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {category.title}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Browse sub-forums, discussions, and resources in {category.title}.
            </p>
          </div>
          <div>
            <Link
              href="/forum"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-xs font-bold bg-[#1c1824] hover:bg-[#282136] text-gray-300 hover:text-white border border-[#3e3450] transition-colors"
            >
              ← All Categories
            </Link>
          </div>
        </div>

        {/* XenForo Category Table */}
        <XenCategoryTable category={category} />
      </div>
    </div>
  );
}
