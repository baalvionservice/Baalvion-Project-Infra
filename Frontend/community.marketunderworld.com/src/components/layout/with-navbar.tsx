import { Navbar } from "@/components/layout/navbar"

// Wraps a section that has no navigation of its own, so a visitor is never stranded on it.
// Pages that already leave room for the fixed menu pass pad={false}.
export function WithNavbar({ children, pad = true }: { children: React.ReactNode; pad?: boolean }) {
  return (
    <>
      <Navbar />
      <div className={pad ? "pt-24" : "pt-4"}>{children}</div>
    </>
  )
}
