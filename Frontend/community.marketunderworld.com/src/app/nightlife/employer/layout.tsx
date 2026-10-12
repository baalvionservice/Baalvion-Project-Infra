import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("nightlife/employer", { title: "Hire people for local jobs", description: "Register your business or venue and post local jobs and gigs." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="nightlife/employer" tone="light" /></>
}
