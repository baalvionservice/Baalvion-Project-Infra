"use client";

import { useState } from "react";

const capData = [
  {
    n: "Allen Krewzz (Deepak Kuldeep)",
    t: "founder",
    tl: "Founder",
    role: "Founder & Chairman",
    eq: "80%",
    max: "80%",
    votes: "Supreme Veto",
    vest: "Permanent",
  },
  {
    n: "Dilip Kuldeep",
    t: "founder",
    tl: "Founder",
    role: "Co-Founder & Partner",
    eq: "20%",
    max: "20%",
    votes: "20 (proportional)",
    vest: "Permanent",
  },
  {
    n: "Adarsh Patra",
    t: "exec",
    tl: "Tier 1",
    role: "CEO & Partner",
    eq: "0.25%",
    max: "5%",
    votes: "10",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "exec",
    tl: "Tier 1",
    role: "COO",
    eq: "0.25%",
    max: "5%",
    votes: "10",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "exec",
    tl: "Tier 1",
    role: "CFO",
    eq: "0.25%",
    max: "5%",
    votes: "10",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "exec",
    tl: "Tier 1",
    role: "CTO",
    eq: "0.25%",
    max: "5%",
    votes: "10",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "exec",
    tl: "Tier 1",
    role: "CMO",
    eq: "0.25%",
    max: "5%",
    votes: "10",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Head of Frontend",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Head of Backend",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Head of AI/ML",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Head of UX/UI",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Head of DevOps",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Head of Security",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Lead Full Stack",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "tech",
    tl: "Tier 2",
    role: "Lead QA",
    eq: "0.25%",
    max: "5%",
    votes: "6",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "ops",
    tl: "Tier 3",
    role: "Head of HR",
    eq: "0.25%",
    max: "3%",
    votes: "3",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "ops",
    tl: "Tier 3",
    role: "Head of Legal",
    eq: "0.25%",
    max: "3%",
    votes: "3",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "ops",
    tl: "Tier 3",
    role: "Head of Admin",
    eq: "0.25%",
    max: "3%",
    votes: "3",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "ops",
    tl: "Tier 3",
    role: "Head of Supply Chain",
    eq: "0.25%",
    max: "3%",
    votes: "3",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "ops",
    tl: "Tier 3",
    role: "Head of Customer Success",
    eq: "0.25%",
    max: "3%",
    votes: "3",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "mkt",
    tl: "Tier 4",
    role: "Head of Marketing",
    eq: "0.25%",
    max: "3%",
    votes: "2",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "mkt",
    tl: "Tier 4",
    role: "Head of Growth",
    eq: "0.25%",
    max: "3%",
    votes: "2",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "mkt",
    tl: "Tier 4",
    role: "Head of PR",
    eq: "0.25%",
    max: "3%",
    votes: "2",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "mkt",
    tl: "Tier 4",
    role: "Head of Social Media",
    eq: "0.25%",
    max: "3%",
    votes: "2",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "mkt",
    tl: "Tier 4",
    role: "Head of Partnerships",
    eq: "0.25%",
    max: "3%",
    votes: "2",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "reg",
    tl: "Tier 5",
    role: "India Regional Lead",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "reg",
    tl: "Tier 5",
    role: "MENA Regional Lead",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "reg",
    tl: "Tier 5",
    role: "Asia-Pacific Lead",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "reg",
    tl: "Tier 5",
    role: "Africa Regional Lead",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "reg",
    tl: "Tier 5",
    role: "Europe/US Lead",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "adv",
    tl: "Tier 6",
    role: "Head of Innovation",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "adv",
    tl: "Tier 6",
    role: "Head of Strategy",
    eq: "0.25%",
    max: "3%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "adv",
    tl: "Tier 6",
    role: "Lead Investor Relations",
    eq: "0.25%",
    max: "1%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "adv",
    tl: "Tier 6",
    role: "Head of Corporate Affairs",
    eq: "0.25%",
    max: "1%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
  {
    n: "[To hire]",
    t: "adv",
    tl: "Tier 6",
    role: "Special Projects Lead",
    eq: "0.25%",
    max: "1%",
    votes: "1",
    vest: "4yr/1yr cliff",
  },
];

const badgeMap: Record<string, string> = {
  founder:
    "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-gold border-so-gold/30 bg-so-gold/7",
  exec: "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-gold border-so-gold/30 bg-so-gold/7",
  tech: "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-blue border-so-blue/30 bg-so-blue/7",
  ops: "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-green border-so-green/25 bg-so-green/6",
  mkt: "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-orange border-so-orange/25 bg-so-orange/6",
  reg: "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-pink border-so-pink/25 bg-so-pink/6",
  adv: "inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-purple border-so-purple/25 bg-so-purple/6",
};
const colorMap: Record<string, string> = {
  founder: "text-so-gold",
  exec: "text-so-gold",
  tech: "text-so-blue",
  ops: "text-so-green",
  mkt: "text-so-orange",
  reg: "text-so-pink",
  adv: "text-so-purple",
};

const filters = [
  { id: "all", label: "All" },
  { id: "founder", label: "Founders" },
  { id: "exec", label: "Exec" },
  { id: "tech", label: "Tech" },
  { id: "ops", label: "Ops" },
  { id: "mkt", label: "Marketing" },
  { id: "reg", label: "Regional" },
  { id: "adv", label: "Advisory" },
];

export default function EquityPane() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered =
    activeFilter === "all"
      ? capData
      : capData.filter((r) => r.t === activeFilter);

  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        EQUITY &amp; <em className="text-so-gold not-italic">CAP TABLE</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        Complete equity table for all 32 stakeholders. All co-founders start at
        0.25% and can grow to 3–5% through performance over 4 years. 4-year
        vest, 1-year cliff applies to all.
      </div>

      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {filters.map((f) => (
          <button
            key={f.id}
            className={`bg-so-card border border-so-border text-[11px] py-1 px-3 rounded-[20px] cursor-pointer font-dm-sans transition-all duration-150 ${
              activeFilter === f.id
                ? "border-so-gold text-so-gold"
                : "text-so-muted hover:text-so-text"
            }`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-5 text-xs">
          <thead>
            <tr>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                #
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Name / Role
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Tier
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Initial Equity
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Max (Performance)
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Votes
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Vesting
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Controls
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.015]">
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[10px] text-so-muted">
                  {String(i + 1).padStart(2, "0")}
                </td>
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                  <div className="text-xs font-medium">{r.role}</div>
                  <div className="text-[10px] text-so-muted">{r.n}</div>
                </td>
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                  <span className={badgeMap[r.t]}>{r.tl}</span>
                </td>
                <td
                  className={`py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-xs font-medium ${
                    colorMap[r.t]
                  }`}
                >
                  {r.eq}
                </td>
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-xs text-so-green">
                  {r.max}
                </td>
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                  {r.votes}
                </td>
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                  {r.vest}
                </td>
                <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                  {r.role}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-[10px] p-3.5 mt-3 text-[12.5px] leading-[1.7] border bg-so-green/5 border-so-green/20">
        <strong className="text-so-green">Key rule:</strong> The 0.25% is given
        AFTER 1-year cliff. Meaning: co-founders work for the first 12 months
        without equity unlocking. After 12 months: 25% of their 0.25% (=
        0.0625%) unlocks. Then monthly over 36 more months. Performance bonuses
        (up to 3–5% extra) are reviewed annually by Allen Krewzz and awarded
        based on results, not just seniority.
      </div>
    </div>
  );
}
