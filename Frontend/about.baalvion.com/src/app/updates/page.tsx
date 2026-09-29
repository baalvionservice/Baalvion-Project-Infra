import { Metadata } from "next";
import UpdatesClient from "./updates-client";

export const metadata: Metadata = {
  title: "Operational Updates Log | Baalvion",
  description: "Real-time transparent log of strategic technical milestones, system upgrades, and global infrastructure development.",
  alternates: { canonical: "https://about.baalvion.com/updates" },
  openGraph: {
    title: "Operational Updates Log | Baalvion",
    description: "Real-time transparent log of strategic technical milestones, system upgrades, and global infrastructure development.",
    url: 'https://about.baalvion.com/updates',
    siteName: 'Baalvion Operating System (BOS)',
    images: [
      {
        url: 'https://about.baalvion.com/api/og?title=Baalvion+Operational+Updates&eyebrow=Baalvion+Industries',
        width: 1200,
        height: 630,
        alt: 'Baalvion Operational Log',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Operational Updates Log | Baalvion",
    description: "Real-time transparent log of strategic technical milestones, system upgrades, and global infrastructure development.",
    images: ['https://about.baalvion.com/api/og?title=Baalvion+Operational+Updates&eyebrow=Baalvion+Industries'],
  },
};

export default function Page() {
  return <UpdatesClient />;
}
