import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("leaderboard", { title: "Leaderboard", description: "See the Hell Road leaderboard." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="leaderboard" tone="light" /></>
}
