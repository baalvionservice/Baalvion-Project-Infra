import { PeopleDirectory } from "@/components/people/directory"
import { PageContent } from "@/components/cms/page-content"

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; city?: string }> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  return (
    <div className="min-h-screen bg-[#050508] text-white pt-24 pb-24">
      <div className="max-w-5xl mx-auto px-5">
        <h1 className="text-3xl md:text-5xl font-bold">People</h1>
        <p className="text-gray-400 mt-3 max-w-2xl">Members who share a public page. Hosts, performers, founders and more, each with their own links.</p>
        <div className="mt-8"><PeopleDirectory founders={false} base="/people" page={page} q={sp.q} city={sp.city} /></div>
        <PageContent slug="people" tone="dark" />
      </div>
    </div>
  )
}
