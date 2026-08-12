import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { HomeSectionHeading } from "./HomeSectionHeading";

interface Leader {
  name: string;
  title: string;
  /** Local photo under public/leadership/ — absent when no real photo is published for this person. */
  photo?: string;
  initials: string;
  profileHref: string;
}

// Sourced directly from Baalvion Industries' own investor-relations governance
// page (ir.baalvion.com/governance/leadership) -- names, titles, and photos are
// real, not placeholders. That page lists 17 people across three tiers
// (Executive Committee, Global Functional Leadership, Vice Presidents); this
// section features the four-person Executive Committee, mirroring how
// reference sites keep an on-page leadership section short and link out to
// the fuller governance page rather than reproducing the whole roster inline.
const EXECUTIVE_COMMITTEE: Leader[] = [
  {
    name: "Deepak Kumar Kuldeep",
    title: "Founder & Chief Visionary Officer",
    initials: "DK",
    profileHref: "https://ir.baalvion.com/governance/leadership/deepak-kumar-kuldeep",
  },
  {
    name: "Tamanna Shaikh",
    title: "Chief Executive Officer (CEO)",
    photo: "/leadership/exec-tamanna-shaikh.png",
    initials: "TS",
    profileHref: "https://ir.baalvion.com/governance/leadership/tamanna-shaikh",
  },
  {
    name: "Dilip Kumar Kuldeep",
    title: "Director",
    photo: "/leadership/exec-dilip-kumar-kuldeep.jpeg",
    initials: "DK",
    profileHref: "https://ir.baalvion.com/governance/leadership/dilip-kumar-kuldeep",
  },
  {
    name: "Adarsh Patra",
    title: "Chief Executive Officer",
    photo: "/leadership/exec-adarsh-patra.jpeg",
    initials: "AP",
    profileHref: "https://ir.baalvion.com/governance/leadership/adarsh-patra",
  },
];

export function Leadership() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 border-t border-border">
      <HomeSectionHeading
        title="Leadership"
        href="https://ir.baalvion.com/governance/leadership"
        hrefLabel="Meet the full leadership team"
      />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Imperialpedia is published by Baalvion Industries Private Limited. Our executive
        committee is listed on Baalvion&apos;s investor-relations site, linked below.
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
        {EXECUTIVE_COMMITTEE.map((leader) => (
          <a
            key={leader.name}
            href={leader.profileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-3 text-center"
          >
            <Avatar className="h-24 w-24 border border-border">
              {leader.photo && <AvatarImage src={leader.photo} alt={leader.name} />}
              <AvatarFallback className="text-lg font-bold">{leader.initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                {leader.name}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {leader.title}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

export default Leadership;
