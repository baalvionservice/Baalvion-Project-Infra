import "./forum.css"
import { Navbar } from "@/components/layout/navbar"
import { BaalFooter } from "@/components/forums/baal-footer"

// The forum shares the site navigation, so a visitor can always move to another section.
export default function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="baal-root">
      <Navbar />
      <main className="baal-main">
        {children}
      </main>
      <BaalFooter />
    </div>
  )
}
