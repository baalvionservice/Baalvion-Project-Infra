import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("forum/join", { title: "Join forum communities | Hell Road", description: "Choose the forum communities you want to join, or ask to enter private ones." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="forum/join" tone="dark" /></>
}
