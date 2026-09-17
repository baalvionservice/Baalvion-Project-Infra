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
    title: "Chief Technology Officer",
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
    { value: "2022", label: "FOUNDED" },
    { value: `${articleCount}+`, label: "ARTICLES PUBLISHED" },
    { value: `${categories.length}+`, label: "TOPICS COVERED" },
    { value: `${authors.length}+`, label: "CONTRIBUTORS" },
  ];

  return (
    <section className="border-t-2 border-black dark:border-slate-800 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 border-3 border-black dark:border-slate-700 p-6 sm:p-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative rounded-xs">
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#c8102e]" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 pt-2">
            {/* Mission */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-[#c8102e] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 -skew-x-12">
                  OUR MISSION
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase font-serif text-black dark:text-white tracking-tighter">
                  Financial Intelligence for Everyone
                </h2>
              </div>
              
              <p className="text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                Imperialpedia began as an independent project on March 26, 2022, built on a simple
                idea: financial information shouldn&apos;t be confusing. As the platform grew, it found
                a permanent home under Baalvion Industries Private Limited, incorporated on March 11,
                2025 — giving the work behind Imperialpedia a real legal foundation and the resources
                to keep building. Today, we connect readers with trustworthy, organized information on
                investing, personal finance, and the wider economy — with transparent sourcing and a
                focus on education, not hype.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t-2 border-black dark:border-slate-800">
                {stats.map((stat) => (
                  <div key={stat.label} className="border-2 border-black dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <span className="block text-2xl sm:text-3xl font-black font-serif text-[#c8102e]">{stat.value}</span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-black dark:text-white">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leadership Roster */}
            <div className="border-t-3 border-black dark:border-slate-700 pt-8 lg:border-l-3 lg:border-t-0 lg:pl-10 lg:pt-0 space-y-5">
              <div className="flex items-center gap-2">
                <span className="bg-black text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
                  GOVERNANCE
                </span>
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
                  // EXECUTIVE BOARD
                </h3>
              </div>

              <h4 className="text-xl font-black uppercase font-serif text-black dark:text-white">
                Corporate Leadership
              </h4>

              <ul className="space-y-4">
                {EXECUTIVE_COMMITTEE.map((leader) => (
                  <li key={leader.name}>
                    <a
                      href={leader.profileHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-2 border-2 border-black/10 dark:border-slate-800 hover:border-black dark:hover:border-slate-600 rounded-xs transition-colors"
                    >
                      <Avatar className="h-12 w-12 shrink-0 rounded-none border-2 border-black dark:border-slate-700 shadow-xs">
                        {leader.photo && (
                          <AvatarImage
                            src={leader.photo}
                            alt={leader.name}
                            className="rounded-none grayscale transition-all duration-300 group-hover:grayscale-0"
                          />
                        )}
                        <AvatarFallback className="rounded-none text-xs font-black font-serif bg-[#c8102e] text-white">
                          {leader.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-xs uppercase font-serif leading-tight text-black dark:text-white group-hover:text-[#c8102e] transition-colors truncate">
                          {leader.name}
                        </p>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wide text-slate-500 truncate">
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
                className="inline-block text-xs font-mono font-black uppercase text-[#c8102e] hover:underline pt-2"
              >
                MEET FULL GOVERNANCE TEAM →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
