import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("clubs/events/submit", { title: "Post your event", description: "Post a club night, party or event with its poster, date and ticket link. The events team checks it before it goes live." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="clubs/events/submit" tone="dark" /></>
}
