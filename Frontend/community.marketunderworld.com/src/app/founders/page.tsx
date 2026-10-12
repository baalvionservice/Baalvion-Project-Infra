import { PeopleDirectory } from "@/components/people/directory"
import { PageContent } from "@/components/cms/page-content"

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; city?: string }> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-5">
        <h1 className="text-3xl md:text-5xl font-bold">Founders</h1>
        <p className="text-gray-400 mt-3 max-w-2xl">Every founder who has switched their public page on, with their company, role and the places to find them.</p>
        <div className="mt-8"><PeopleDirectory founders={true} base="/founders" page={page} q={sp.q} city={sp.city} /></div>
        <PageContent slug="founders" tone="dark" />
      </div>
    </div>
  )
}
