import type { Metadata } from "next";
import "./globals.css";
import { Header, Footer } from "@/components/ui";
import { SITE_URL } from "@/lib/api";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Baalvion Insiders — Where Founders Meet Active Investors",
    template: "%s | Baalvion Insiders",
  },
  description:
    "Find investors who recently funded businesses like yours, by sector and stage — and raise your round faster on Baalvion.",
  applicationName: "Baalvion Insiders",
  openGraph: {
    type: "website",
    siteName: "Baalvion Insiders",
    title: "Baalvion Insiders — Where Founders Meet Active Investors",
    description: "Find investors who recently funded businesses like yours, and get funded faster.",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image", site: "@baalvion" },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
