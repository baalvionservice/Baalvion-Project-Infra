import type { ReactNode } from "react";
import TopNav from "@/components/cnbc/TopNav";
import Footer from "@/components/cnbc/Footer";

/**
 * CNBC-style shell for /news — same shared masthead/footer as /world and
 * /market-news (src/components/cnbc/*). No webfont loading here (unlike
 * /world's layout.tsx) since this route uses the literal CNBC
 * Arial/Helvetica stack from .cnbc-shell directly, not the softer
 * Inter/Barlow/Lato system /world carries for historical reasons.
 */
export default function NewsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="cnbc-shell flex min-h-screen flex-col bg-black">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
