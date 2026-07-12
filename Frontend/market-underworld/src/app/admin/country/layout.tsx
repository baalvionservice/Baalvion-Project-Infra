import { CountrySidebar } from "@/components/admin/country-sidebar"
import { Navbar } from "@/components/layout/navbar"

export default function CountryAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />
      <div className="flex pt-20">
        <aside className="hidden lg:block w-72 h-[calc(100vh-80px)] fixed left-0 border-r border-white/5 bg-[#0A0A0F] z-40 overflow-y-auto no-scrollbar">
          <CountrySidebar />
        </aside>
        <main className="flex-1 lg:ml-72 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>
    </div>
  )
}