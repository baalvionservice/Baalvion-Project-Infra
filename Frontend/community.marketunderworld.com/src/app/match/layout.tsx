
import { Navbar } from "@/components/layout/navbar"
import { NeuralNetworkBg } from "@/components/match/neural-network-bg"
import { AIChatWidget } from "@/components/match/ai-chat-widget"

export default function AIMatchLayout({
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
