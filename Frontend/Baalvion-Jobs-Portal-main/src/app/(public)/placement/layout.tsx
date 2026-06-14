import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Verified Campus Placements | TalentOS by Baalvion",
  description:
    "TalentOS by Baalvion Industries Pvt Ltd connects colleges, students, and recruiters through a document-verified, merit-based campus placement program across Type 1, Type 2, and Type 3 institutions. Zero fraud. 100% verified records.",
  keywords: [
    "campus placement",
    "verified placement",
    "TalentOS",
    "Baalvion campus hiring",
    "campus recruitment India",
    "college placement program",
    "Type 1 Type 2 Type 3 colleges",
    "student placement portal",
    "verified offer letter",
    "campus hiring platform",
    "education to employment",
    "placement cell automation",
  ],
  alternates: {
    canonical: "/placement",
  },
  openGraph: {
    type: "website",
    title: "Verified Campus Placements | TalentOS by Baalvion",
    description:
      "India's trusted education-to-employment platform. Document-verified campus placements across Type 1, Type 2, and Type 3 colleges. Zero fraud, 100% verified.",
    url: "/placement",
    siteName: "TalentOS by Baalvion",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verified Campus Placements | TalentOS by Baalvion",
    description:
      "India's trusted education-to-employment platform. Document-verified campus placements across Type 1, Type 2, and Type 3 colleges.",
  },
};

export default function PlacementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
