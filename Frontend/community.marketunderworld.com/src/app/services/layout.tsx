import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"

export const generateMetadata = (): Promise<Metadata> => pageMetadata("services", {
  title: "Everything Hell Road offers: nightlife, circle, work and exchange",
  description: "Every service on Hell Road in one place: venue directory for India and Dubai, events, ticket draws, Elite parties, forums, dating, local jobs, education, marketplace, wallet and more.",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
