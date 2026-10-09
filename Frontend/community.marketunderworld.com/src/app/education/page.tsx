import type { Metadata } from "next"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { getTeachers, getUpcomingSessions } from "@/lib/api/education"
import { EducationClient } from "./education-client"

export const metadata: Metadata = {
  title: "Education | Market Underworld",
  description: "Learn from approved teachers in live sessions. Browse teachers by subject and region and request a place.",
}

export default async function EducationPage({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const { region } = await searchParams
  const [teachers, sessions] = await Promise.all([getTeachers(), getUpcomingSessions()])

  return (
    <div className="min-h-screen bg-brand-base text-text-primary">
      <Navbar />
      <main className="container max-w-7xl mx-auto px-6 pt-44 pb-32">
        <header className="mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Learn from <span className="text-brand-green">approved teachers.</span></h1>
          <p className="text-text-secondary text-lg max-w-2xl">
            Every teacher is reviewed by our team before they appear here. Sessions run on the teacher&apos;s own video link, and pricing is agreed directly with the teacher; nothing is charged by this site.
          </p>
        </header>
        <EducationClient teachers={teachers} sessions={sessions} initialRegion={region} />
      </main>
      <Footer />
    </div>
  )
}
