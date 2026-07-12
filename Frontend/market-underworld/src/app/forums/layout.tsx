import { ForumHeader } from "@/components/forums/forum-header"
import { Footer } from "@/components/layout/footer"

export default function ForumsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-cyan-500/20">
      {/* Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))', backgroundSize: '100% 4px, 3px 100%' }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <ForumHeader />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  )
}
