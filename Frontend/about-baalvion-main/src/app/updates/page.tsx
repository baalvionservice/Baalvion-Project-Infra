import { Metadata } from "next";
import UpdatesClient from "./updates-client";

export const metadata: Metadata = {
  title: "Operational Updates Log | Baalvion Nexus",
  description: "Real-time transparent log of strategic technical milestones, system upgrades, and global infrastructure development.",
  openGraph: {
    title: "Operational Updates Log | Baalvion Nexus",
    description: "Real-time transparent log of strategic technical milestones, system upgrades, and global infrastructure development.",
    url: 'https://baalvion.nexus/updates',
    siteName: 'Baalvion Nexus',
    images: [
      {
        url: 'https://picsum.photos/seed/baalvion-updates/1200/630',
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
    title: "Operational Updates Log | Baalvion Nexus",
    description: "Real-time transparent log of strategic technical milestones, system upgrades, and global infrastructure development.",
    images: ['https://picsum.photos/seed/baalvion-updates/1200/630'],
  },
};

export default function Page() {
  return <UpdatesClient />;
}
