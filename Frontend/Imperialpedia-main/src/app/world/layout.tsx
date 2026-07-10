import type { ReactNode } from "react";
import TopNav from "@/components/world/TopNav";
import Footer from "@/components/world/Footer";

/**
 * World news vertical shell — its own CNBC-style masthead and footer,
 * intentionally distinct from the sitewide Investopedia-style Navbar/Footer
 * (suppressed for /world/* in RootLayoutClient) so the two identities never
 * stack on top of each other.
 */
export default function WorldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
