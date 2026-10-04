import "./forum.css"
import { BaalHeader } from "@/components/forums/baal-header"
import { BaalFooter } from "@/components/forums/baal-footer"

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="baal-root">
      <BaalHeader />
      <main className="baal-main">
        {children}
      </main>
      <BaalFooter />
    </div>
  )
}
