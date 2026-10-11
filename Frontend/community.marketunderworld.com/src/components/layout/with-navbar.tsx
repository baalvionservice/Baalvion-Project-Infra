import { Navbar } from "@/components/layout/navbar"

// Wraps a section that has no navigation of its own, so a visitor is never stranded on it.
export function WithNavbar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="pt-24">{children}</div>
    </>
  )
}
