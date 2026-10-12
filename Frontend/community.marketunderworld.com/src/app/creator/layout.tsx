import type { Metadata } from "next"
export const metadata: Metadata = { robots: { index: false, follow: false } }
import { WithNavbar } from "@/components/layout/with-navbar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WithNavbar>{children}</WithNavbar>
}
