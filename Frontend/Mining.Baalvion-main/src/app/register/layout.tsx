import type { Metadata } from "next";

// Account creation flow — kept out of the search index.
export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a Baalvion Mining Inc. account to source verified minerals, list supply, and access AI-powered trade compliance.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
