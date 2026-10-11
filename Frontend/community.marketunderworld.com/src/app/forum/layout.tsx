import "./forum.css"
import { Navbar } from "@/components/layout/navbar"
import { BaalHeader } from "@/components/forums/baal-header"
import { BaalFooter } from "@/components/forums/baal-footer"

// The site menu on top (so a visitor can always leave the forum) and the forum's own navigation under it.
export default function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="baal-root">
      <Navbar />
      <div className="h-[88px]" aria-hidden="true" />
      <BaalHeader />
      <main className="baal-main">
        {children}
      </main>
      <BaalFooter />
    </div>
  )
}
