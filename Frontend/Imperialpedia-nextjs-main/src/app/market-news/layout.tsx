import type { ReactNode } from "react";
import TopNav from "@/components/imperialpedia/TopNav";
import Footer from "@/components/imperialpedia/Footer";

/**
 * Imperialpedia-style shell for /market-news — same shared masthead/footer as /world
 * and /news (src/components/imperialpedia/*). See news/layout.tsx for why no webfont
 * loading happens here.
 */
export default function MarketNewsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="imperialpedia-shell flex min-h-screen flex-col bg-black">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
