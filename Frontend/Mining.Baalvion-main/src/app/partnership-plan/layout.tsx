import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partnership Plan | Baalvion Mining Inc.",
  description:
    "Join the Baalvion Mining Inc. partner network. Complete our trade readiness survey and receive a custom partnership roadmap for your mining business.",
  alternates: { canonical: "https://mining.baalvion.com/partnership-plan" },
  openGraph: {
    title: "Partnership Plan | Baalvion Mining Inc.",
    description:
      "Get a custom partnership roadmap for your mining business. Join the Baalvion Mining Inc. global network.",
    url: "https://mining.baalvion.com/partnership-plan",
    siteName: "Baalvion Mining Inc.",
  },
};

export default function PartnershipPlanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
