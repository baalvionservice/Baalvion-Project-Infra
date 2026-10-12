import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
import { WithNavbar } from "@/components/layout/with-navbar"

export const generateMetadata = (): Promise<Metadata> => pageMetadata("founders", { title: "Founders on Hell Road", description: "Founders who are members of Hell Road: their company, role, city and links. Find a founder to meet, hire or work with." })

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WithNavbar pad={false}>{children}</WithNavbar>
}
