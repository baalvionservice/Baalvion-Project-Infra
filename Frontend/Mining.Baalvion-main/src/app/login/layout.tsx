import type { Metadata } from "next";

// Authentication entry point — kept out of the search index.
export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Baalvion Mining Inc. account to access the trade dashboard, marketplace, and compliance tools.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
