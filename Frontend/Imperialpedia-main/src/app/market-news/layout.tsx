import type { ReactNode } from "react";
import TopNav from "@/components/cnbc/TopNav";
import Footer from "@/components/cnbc/Footer";

/**
 * CNBC-style shell for /market-news — same shared masthead/footer as /world
 * and /news (src/components/cnbc/*). See news/layout.tsx for why no webfont
 * loading happens here.
 */
export default function MarketNewsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cnbc-shell flex min-h-screen flex-col bg-black">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
