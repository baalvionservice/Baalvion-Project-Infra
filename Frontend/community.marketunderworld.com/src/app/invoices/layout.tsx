import { WithNavbar } from "@/components/layout/with-navbar"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WithNavbar pad={false}>{children}</WithNavbar>
}
