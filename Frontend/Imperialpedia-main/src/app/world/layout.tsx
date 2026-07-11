import type { ReactNode } from "react";
import { Inter, Barlow_Condensed, Lato } from "next/font/google";
import TopNav from "@/components/world/TopNav";
import Footer from "@/components/world/Footer";

// Free equivalents for the World vertical's CNBC-style type system:
// Proxima Nova/Averta (headlines, UI) -> Inter, FoundersGroteskCond
// (ticker/kicker labels) -> Barlow Condensed, Lato (body) -> Lato (CNBC's
// actual body font, and free). Scoped via CSS vars so the sitewide
// Investopedia serif theme is untouched outside /world/*.
const worldSans = Inter({ subsets: ["latin"], variable: "--font-world-sans", display: "swap" });
const worldCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-world-condensed",
  display: "swap",
});
const worldBody = Lato({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-world-body", display: "swap" });

/**
 * World news vertical shell — its own CNBC-style masthead and footer,
 * intentionally distinct from the sitewide Investopedia-style Navbar/Footer
 * (suppressed for /world/* in RootLayoutClient) so the two identities never
 * stack on top of each other.
 */
export default function WorldLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`world-shell flex min-h-screen flex-col bg-gray-100 ${worldSans.variable} ${worldCondensed.variable} ${worldBody.variable}`}
    >
      <TopNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
