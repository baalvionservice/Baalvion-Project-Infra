"use client";

import { useState } from "react";

const announcementTemplate = `🚀 BAALVION INDUSTRIES — NEW CO-FOUNDER ANNOUNCEMENT

We are proud to welcome [FULL NAME] as [TITLE] of Baalvion Industries Private Limited.

[First Name] brings [X years] of expertise in [domain] and joins our growing team of 30 co-founders building India's most ambitious technology conglomerate.

At Baalvion, [First Name] will lead [their function] across our four live platforms:
• Baalvion Mining Inc. — Global AI mineral trade marketplace
• Imperialpedia — AI financial knowledge infrastructure  
• Baalvion Stack — Enterprise data network
• Investor Relations Portal — ir.baalvion.com

"[Quote from new co-founder]"
— [Full Name], [Title], Baalvion Industries

"[Quote from Allen Krewzz welcoming them]"
— Allen Krewzz, Founder & Chairman | Deepak Kuldeep

Together we are building India's $33 trillion vision.

Founder: Allen Krewzz (Deepak Kuldeep) — 80%
Strategic Partner: Dilip Kuldeep — 20%

🔗 ir.baalvion.com | mining.baalvion.com | imperialpedia.com | baalvionstack.com
CIN: U43121OD2025PTC048479

#Baalvion #BaalvionIndustries #AllenKrewzz #DilipKuldeep #IndiaStartup`;

const prSteps = [
  {
    num: 1,
    color: "#ff5252",
    bg: "#ff5252",
    borderColor: "#e8c547",
    title: "Universal Bio Template — Every Co-Founder Gets This on Day 1",
    desc: `Head of PR creates a bio template for each co-founder. All bios follow the same structure so Google consistently links their name to Baalvion. Every co-founder's bio must end with "ir.baalvion.com".`,
    items: [
      'One-liner: "[Name] — [Title], Baalvion Industries | [Platform]"',
      "LinkedIn Headline format",
      "Twitter bio format",
      "Press mention format",
      "Email signature template",
    ],
  },
  {
    num: 2,
    color: "#4f9eff",
    bg: "#4f9eff",
    borderColor: "#4f9eff",
    title: "LinkedIn — All 30 Create Profile on Day 1",
    desc: 'LinkedIn ranks on Google Page 1 for any executive name within 2 weeks. 30 co-founders on LinkedIn = 30 guaranteed Google results for "[Name] Baalvion". Head of Social Media manages a shared Baalvion company LinkedIn page that all 30 follow and post from.',
    items: [
      "Create Day 1",
      "Add Baalvion as employer",
      "Post 2x/week minimum",
      "Connect with all 30 co-founders",
      "Tag @BaalvionGroup in posts",
    ],
  },
  {
    num: 3,
    color: "#22d3a5",
    bg: "#22d3a5",
    borderColor: "#22d3a5",
    title: "Professional Photos — All 30 Within Week 1",
    desc: 'Hire a photographer for a group session — all co-founders shoot on the same day with the same background, lighting, and styling. Consistent professional photos make Baalvion look like a world-class organization. All photos named: "[FirstName]-[LastName]-[Title]-Baalvion.jpg" for Google Image SEO.',
    items: [
      "Group photoshoot",
      "Same background/lighting",
      "Correct filename for Google",
      "Add to all profiles + website",
      "Baalvion Team Page updated",
    ],
  },
  {
    num: 4,
    color: "#fb923c",
    bg: "#fb923c",
    borderColor: "#fb923c",
    title: "Wikidata — All 30 Get Entries (No Press Needed)",
    desc: "Anyone can create a Wikidata entry. This triggers Google Knowledge Panel (the box with photo that appears on the right side of Google search). SEO team creates Wikidata entries for all 30 co-founders in Month 1. No press coverage required for this step.",
    items: [
      "wikidata.org/wiki/Special:NewItem",
      "Name, title, employer: Baalvion",
      "Link all social profiles",
      "Link to Baalvion Wikidata entity",
      "Done by SEO team in bulk",
    ],
  },
  {
    num: 5,
    color: "#a78bfa",
    bg: "#a78bfa",
    borderColor: "#a78bfa",
    title: "Press — 30 Different Story Angles for 30 Different Co-Founders",
    desc: 'Each co-founder has a unique expert angle. A journalist won\'t run 30 "Baalvion CEO" stories — but they will run a "CTO building AI for mineral trade" story, a "CFO managing India\'s global tech conglomerate finances" story, and a "Head of DevOps scaling 4 platforms simultaneously" story. 30 co-founders = 30 unique press pitches.',
    items: [
      "CTO → TechCrunch / VentureBeat",
      "CFO → Economic Times",
      "Head of AI → AI publications",
      "Mining leads → Kitco / Mining.com",
      "Regional leads → local press",
      "Goal: each person in 3+ articles/year",
    ],
  },
  {
    num: 6,
    color: "#2dd4bf",
    bg: "#2dd4bf",
    borderColor: "#2dd4bf",
    title: "Coordinated Announcement Template — Use for Every New Co-Founder",
    desc: "When each co-founder joins, Baalvion sends this announcement to press, posts on all social media, and all other 29 co-founders like/share/comment — amplifying reach 30x instantly.",
    items: [],
  },
];

export default function PRPane() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(announcementTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        PR &amp; GOOGLE RECOGNITION{" "}
        <em className="text-so-gold not-italic">— ALL 30</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        Every co-founder must be publicly recognized on Google, LinkedIn,
        Wikipedia and in press. 30 recognized executives = 30x more Baalvion
        press mentions globally.
      </div>

      <div className="rounded-[10px] p-3.5 mb-4 text-[12.5px] leading-[1.7] border bg-so-green/5 border-so-green/20">
        <strong className="text-so-green">The multiplier rule:</strong> Each
        co-founder who is active online and featured in press = one more PR
        asset for Baalvion. 30 co-founders all posting about Baalvion on the
        same day = coordinated brand awareness that no single-founder company
        can match.
      </div>

      <div className="flex flex-col gap-2 mb-5">
        {prSteps.map((step) => (
          <div
            key={step.num}
            className="bg-so-card border border-so-border border-l-[3px] rounded-lg p-3 grid grid-cols-[32px_1fr] gap-3 items-start"
            style={{ borderLeftColor: step.borderColor }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bebas text-base flex-shrink-0"
              style={{ backgroundColor: `${step.bg}15`, color: step.color }}
            >
              {step.num}
            </div>
            <div>
              <h3 className="text-[13px] font-medium mb-1">{step.title}</h3>
              <p className="text-xs text-so-muted leading-[1.6]">{step.desc}</p>
              {step.items.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {step.items.map((item, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-so-s2 border border-so-border rounded py-0.5 px-2 text-so-text"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="relative bg-black/40 border border-so-border rounded-lg p-3.5 text-xs font-dm-mono leading-[1.85] text-[#b8cfe0] mb-3.5 whitespace-pre-wrap">
        <button
          className="absolute top-2.5 right-2.5 bg-so-gold text-black border-none rounded-md font-dm-sans text-[10px] font-bold py-1 px-2.5 cursor-pointer hover:bg-so-gold/90"
          onClick={handleCopy}
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
        {announcementTemplate}
      </div>
    </div>
  );
}
