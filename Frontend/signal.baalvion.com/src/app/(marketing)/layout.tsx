import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { LaunchBanner } from "@/components/launch-banner";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LaunchBanner />
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
