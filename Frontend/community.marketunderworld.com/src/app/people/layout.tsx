import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
import { WithNavbar } from "@/components/layout/with-navbar"

export const generateMetadata = (): Promise<Metadata> => pageMetadata("people", { title: "People on Hell Road", description: "Members of Hell Road who share a public page: DJs, hosts, performers, founders and more. See who they are and where to find them." })

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WithNavbar pad={false}>{children}</WithNavbar>
}
