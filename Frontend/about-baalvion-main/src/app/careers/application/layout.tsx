import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Application | Baalvion Industries",
  description: "Apply to build infrastructure-grade software with Baalvion Industries.",
  alternates: { canonical: "https://about.baalvion.com/careers/application" },
  // Application form is a transactional, non-content page — keep it out of the
  // index while still allowing crawlers to follow links back to the site.
  robots: { index: false, follow: true },
};

export default function CareerApplicationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
