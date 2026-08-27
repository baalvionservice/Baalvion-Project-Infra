import React from "react";
import { getCategoryDirectory, getPublicAuthors } from "@/services/data/cms-public";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

/**
 * "Our Mission" + "Leadership" — the closing trust section, mirroring how
 * reference editorial sites pair a mission statement and real stats with a
 * leadership/advisor list near the bottom of the homepage. The stats are
 * live counts of what this site actually publishes (categories, articles,
 * contributors) via the same CMS service AllCategories/EditorialTeam draw
 * from -- not the Companies/Countries/Technologies-tracked figures this used
 * to show, which described a different Baalvion property's market-data
 * breadth, not Imperialpedia's own editorial output. Never a separate,
 * driftable, or unverifiable number ("30+ Million Readers") -- see the Law
 * Elite Network and Imperialpedia "remove unverifiable stats" history.
 */
export async function Leadership() {
  const [categories, authors] = await Promise.all([
    getCategoryDirectory(),
    getPublicAuthors(),
  ]);
  const articleCount = categories.reduce((sum, c) => sum + c.articleCount, 0);

  const stats = [
    { value: "2022", label: "Founded" },
    { value: `${articleCount}+`, label: "Articles Published" },
    { value: `${categories.length}+`, label: "Topics Covered" },
    { value: `${authors.length}+`, label: "Contributors" },
  ];

  return (
    <section className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Our Mission</h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Imperialpedia began as an independent project on March 26, 2022, built on a simple
            idea: financial information shouldn&apos;t be confusing. As the platform grew, it found
            a permanent home under Baalvion Industries Private Limited, incorporated on March 11,
            2025 — giving the work behind Imperialpedia a real legal foundation and the resources
            to keep building. Today, we connect readers with trustworthy, organized information on
            investing, personal finance, and the wider economy — with transparent sourcing and a
            focus on education, not hype.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <span className="block text-3xl font-black text-primary">{stat.value}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          <h2 className="text-xl font-black tracking-tight text-foreground">Leadership</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Imperialpedia is published by Baalvion Industries Private Limited. Our executive
            committee is listed on Baalvion&apos;s investor-relations site.
          </p>
          <ul className="mt-6 space-y-5">
            {EXECUTIVE_COMMITTEE.map((leader) => (
              <li key={leader.name}>
                <a
                  href={leader.profileHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <Avatar className="h-16 w-16 shrink-0 rounded-lg border border-border">
                    {leader.photo && (
                      <AvatarImage
                        src={leader.photo}
                        alt={leader.name}
                        className="rounded-lg grayscale transition-all duration-300 group-hover:grayscale-0"
                      />
                    )}
                    <AvatarFallback className="rounded-lg text-sm font-bold">
                      {leader.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                      {leader.name}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {leader.title}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="https://ir.baalvion.com/governance/leadership"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm font-bold text-primary hover:underline"
          >
            Meet the full leadership team →
          </a>
        </div>
      </div>
    </section>
  );
}
