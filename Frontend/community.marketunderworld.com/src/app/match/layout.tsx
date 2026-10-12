import { PageContent } from "@/components/cms/page-content"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("match", { title: "Match quiz", description: "Take the Hell Road match quiz." })

import { Navbar } from "@/components/layout/navbar"
import { NeuralNetworkBg } from "@/components/match/neural-network-bg"
import { AIChatWidget } from "@/components/match/ai-chat-widget"

function AIMatchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <Navbar />
      <NeuralNetworkBg />
      <main className="relative z-10">
        {children}
      </main>
      <AIChatWidget />
    </div>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AIMatchLayout>{children}<PageContent slug="match" tone="dark" /></AIMatchLayout>
}
