"use client";

import { useState } from "react";

interface NodeInfo {
  title: string;
  tier: string;
  equity: string;
  desc: string;
  controls: string;
}

interface OrgNodeProps {
  title: string;
  name?: string;
  equity: string;
  type: string;
  tier: string;
  equityFull: string;
  desc: string;
  controls: string;
  onNodeClick: (info: NodeInfo) => void;
}

const nodeTypeClasses = {
  "n-founder": "bg-so-gold/18 border-2 border-so-gold",
  "n-partner": "bg-so-blue/14 border-[1.5px] border-so-blue/50",
  "n-exec": "bg-so-gold/8 border border-so-gold/30",
  "n-tech": "bg-so-blue/7 border border-so-blue/30",
  "n-ops": "bg-so-green/6 border border-so-green/25",
  "n-mkt": "bg-so-orange/6 border border-so-orange/25",
  "n-reg": "bg-so-pink/6 border border-so-pink/25",
  "n-adv": "bg-so-purple/6 border border-so-purple/25",
};

const nodeTextClasses = {
  "n-founder": "text-so-gold text-xs",
  "n-partner": "text-so-blue",
  "n-exec": "text-so-gold",
  "n-tech": "text-so-blue",
  "n-ops": "text-so-green",
  "n-mkt": "text-so-orange",
  "n-reg": "text-so-pink",
  "n-adv": "text-so-purple",
};

function OrgNode({
  title,
  name,
  equity,
  type,
  tier,
  equityFull,
  desc,
  controls,
  onNodeClick,
}: OrgNodeProps) {
  return (
    <div
      className={`rounded-lg py-2 px-3 text-center min-w-[130px] max-w-[165px] cursor-pointer transition-all duration-150 hover:-translate-y-0.5 flex-shrink-0 ${
        nodeTypeClasses[type as keyof typeof nodeTypeClasses]
      }`}
      onClick={() =>
        onNodeClick({ title, tier, equity: equityFull, desc, controls })
      }
    >
      <div
        className={`text-[10.5px] font-medium mb-0.5 leading-[1.3] ${
          nodeTextClasses[type as keyof typeof nodeTextClasses]
        }`}
      >
        {title}
      </div>
      {name && <div className="text-[9px] opacity-65 font-dm-mono">{name}</div>}
      <div className="text-[9px] mt-0.5 font-dm-mono opacity-60">{equity}</div>
    </div>
  );
}

export default function OrgChartPane() {
  const [modal, setModal] = useState<NodeInfo | null>(null);

  const click = (info: NodeInfo) => setModal(info);

  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        VISUAL <em className="text-so-gold not-italic">ORG CHART</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        Full hierarchy from Founder &amp; Chairman down through all 6 tiers.
        Click any node to see equity and responsibility details.
      </div>

      <div className="overflow-x-auto pb-2 mx-auto">
        <div className="flex flex-col items-center gap-0 max-w-[900px] mx-auto">
          {/* FOUNDERS */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-gold">
              FOUNDERS — Parent Ownership (Not diluted by co-founder grants)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              <OrgNode
                title="👑 Allen Krewzz"
                name="Deepak Kuldeep"
                equity="80% · Supreme Veto"
                equityFull="80%"
                type="n-founder"
                tier="Founder & Chairman"
                desc="Supreme veto on all decisions. Sets vision. Cannot be outvoted by any co-founder combination."
                controls="All of Baalvion Industries"
                onNodeClick={click}
              />
              <OrgNode
                title="🤝 Dilip Kuldeep"
                name="Co-Founder & Partner"
                equity="20% · Strategic Vote"
                equityFull="20%"
                type="n-partner"
                tier="Co-Founder & Strategic Partner"
                desc="Strategic voting rights proportional to 20% stake. Advisory and governance role."
                controls="Board-level strategic decisions"
                onNodeClick={click}
              />
            </div>
          </div>

          <div className="flex justify-center my-0.5">
            <div className="w-px h-4 bg-so-border"></div>
          </div>

          {/* TIER 1 */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-gold">
              TIER 1 — Core Executive (5 people · 0.25% initial → up to 5%
              performance)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[
                {
                  title: "CEO & Partner",
                  name: "Adarsh Patra",
                  desc: "Full operational control. Reports to Founder. Manages all 28 other co-founders. 10 votes.",
                  controls: "All 4 Baalvion platforms",
                },
                {
                  title: "COO",
                  name: "[To hire]",
                  desc: "Operational efficiency, process management, cross-department coordination. 10 votes.",
                  controls: "Ops, HR, Admin, Supply Chain, Legal",
                },
                {
                  title: "CFO",
                  name: "[To hire]",
                  desc: "All financial decisions, investor management, funding rounds, cash flow. 10 votes.",
                  controls: "Finance, Investor Relations",
                },
                {
                  title: "CTO",
                  name: "[To hire]",
                  desc: "All technology strategy and infrastructure across all 4 platforms. 10 votes.",
                  controls: "All 8 Tech Leads",
                },
                {
                  title: "CMO",
                  name: "[To hire]",
                  desc: "Marketing, growth, branding, and global expansion strategy. 10 votes.",
                  controls: "Marketing, Growth, PR, Social, Partners",
                },
              ].map((n) => (
                <OrgNode
                  key={n.title}
                  title={n.title}
                  name={n.name}
                  equity="0.25%→5% · 10v"
                  equityFull="0.25% → up to 5%"
                  type="n-exec"
                  tier="Tier 1 — Core Executive"
                  desc={n.desc}
                  controls={n.controls}
                  onNodeClick={click}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center my-0.5">
            <div className="w-px h-4 bg-so-border"></div>
          </div>

          {/* TIER 2 */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-blue">
              TIER 2 — Product &amp; Tech Leads (8 people · 0.25% initial → up
              to 5%)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[
                {
                  title: "Head of Frontend",
                  desc: "All frontend development across 4 platforms. Reports to CTO. 6 votes.",
                  controls: "Frontend team",
                },
                {
                  title: "Head of Backend",
                  desc: "APIs, databases, server architecture. Reports to CTO. 6 votes.",
                  controls: "Backend team",
                },
                {
                  title: "Head of AI/ML",
                  desc: "AI/ML systems, Imperialpedia intelligence engine, Mining AI. Reports to CTO. 6 votes.",
                  controls: "AI/ML team",
                },
                {
                  title: "Head of UX/UI",
                  desc: "Design system, user experience across all platforms. Reports to CTO. 6 votes.",
                  controls: "Design team",
                },
                {
                  title: "Head of DevOps",
                  desc: "Cloud, CI/CD pipelines, servers, uptime. Reports to CTO. 6 votes.",
                  controls: "DevOps team",
                },
                {
                  title: "Head of Security",
                  desc: "Cybersecurity, data protection, compliance. Reports to CTO. 6 votes.",
                  controls: "Security team",
                },
                {
                  title: "Lead Full Stack",
                  desc: "Full-stack coordination, bridges frontend and backend teams. 6 votes.",
                  controls: "Full stack developers",
                },
                {
                  title: "Lead QA",
                  desc: "Quality testing, bug tracking, release standards. 6 votes.",
                  controls: "QA team",
                },
              ].map((n) => (
                <OrgNode
                  key={n.title}
                  title={n.title}
                  equity="0.25%→5% · 6v"
                  equityFull="0.25% → up to 5%"
                  type="n-tech"
                  tier="Tier 2 — Tech Lead"
                  desc={n.desc}
                  controls={n.controls}
                  onNodeClick={click}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center my-0.5">
            <div className="w-px h-4 bg-so-border"></div>
          </div>

          {/* TIER 3 */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-green">
              TIER 3 — Operations (5 people · 0.25% initial → up to 3%)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[
                {
                  title: "Head of HR",
                  desc: "Recruitment, talent, culture, performance reviews. Reports to COO. 3 votes.",
                  controls: "HR team",
                },
                {
                  title: "Head of Legal",
                  desc: "Contracts, compliance, trademarks, disputes. Reports to COO. 3 votes.",
                  controls: "Legal team",
                },
                {
                  title: "Head of Admin",
                  desc: "Daily operations, vendors, facilities. Reports to COO. 3 votes.",
                  controls: "Admin team",
                },
                {
                  title: "Head of Supply Chain",
                  desc: "Mining logistics, cross-border exports, procurement. Reports to COO. 3 votes.",
                  controls: "Supply chain",
                },
                {
                  title: "Head of Cust. Success",
                  desc: "Client relationships, support, onboarding. Reports to COO. 3 votes.",
                  controls: "CS team",
                },
              ].map((n) => (
                <OrgNode
                  key={n.title}
                  title={n.title}
                  equity="0.25%→3% · 3v"
                  equityFull="0.25% → up to 3%"
                  type="n-ops"
                  tier="Tier 3 — Operations"
                  desc={n.desc}
                  controls={n.controls}
                  onNodeClick={click}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center my-0.5">
            <div className="w-px h-4 bg-so-border"></div>
          </div>

          {/* TIER 4 */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-orange">
              TIER 4 — Marketing &amp; Growth (5 people · 0.25% initial → up to
              3%)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[
                {
                  title: "Head of Marketing",
                  desc: "Brand campaigns, advertising, content strategy. Reports to CMO. 2 votes.",
                  controls: "Marketing team",
                },
                {
                  title: "Head of Growth",
                  desc: "User acquisition, retention, conversion optimization. Reports to CMO. 2 votes.",
                  controls: "Growth team",
                },
                {
                  title: "Head of PR",
                  desc: "Media relations, press, journalist outreach, public image. Reports to CMO. 2 votes.",
                  controls: "PR team",
                },
                {
                  title: "Head of Social Media",
                  desc: "LinkedIn, Twitter, Instagram, YouTube for all Baalvion brands. Reports to CMO. 2 votes.",
                  controls: "Social team",
                },
                {
                  title: "Head of Partnerships",
                  desc: "B2B partnerships, corporate collaborations, alliances. Reports to CMO. 2 votes.",
                  controls: "Partnerships team",
                },
              ].map((n) => (
                <OrgNode
                  key={n.title}
                  title={n.title}
                  equity="0.25%→3% · 2v"
                  equityFull="0.25% → up to 3%"
                  type="n-mkt"
                  tier="Tier 4 — Marketing"
                  desc={n.desc}
                  controls={n.controls}
                  onNodeClick={click}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center my-0.5">
            <div className="w-px h-4 bg-so-border"></div>
          </div>

          {/* TIER 5 */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-pink">
              TIER 5 — Regional Coordinators (5 people · 0.25% initial → up to
              3%)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[
                {
                  title: "India Regional Lead",
                  desc: "All India operations, teams, and growth. Reports to COO. 1 vote.",
                  controls: "India sub-teams",
                },
                {
                  title: "MENA Regional Lead",
                  desc: "UAE, Saudi, Egypt markets. Reports to COO. 1 vote.",
                  controls: "MENA sub-teams",
                },
                {
                  title: "Asia-Pacific Lead",
                  desc: "SEA, Singapore, Australia expansion. Reports to COO. 1 vote.",
                  controls: "APAC sub-teams",
                },
                {
                  title: "Africa Regional Lead",
                  desc: "Africa mineral trade markets. Reports to COO. 1 vote.",
                  controls: "Africa sub-teams",
                },
                {
                  title: "Europe/US Lead",
                  desc: "US, UK, EU investor and partner markets. Reports to COO. 1 vote.",
                  controls: "Western sub-teams",
                },
              ].map((n) => (
                <OrgNode
                  key={n.title}
                  title={n.title}
                  equity="0.25%→3% · 1v"
                  equityFull="0.25% → up to 3%"
                  type="n-reg"
                  tier="Tier 5 — Regional"
                  desc={n.desc}
                  controls={n.controls}
                  onNodeClick={click}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center my-0.5">
            <div className="w-px h-4 bg-so-border"></div>
          </div>

          {/* TIER 6 */}
          <div className="w-full mb-1">
            <div className="font-dm-mono text-[9px] tracking-[1.5px] uppercase text-center py-1 pb-1.5 mb-1.5 border-b border-so-border text-so-purple">
              TIER 6 — Advisory &amp; Strategy (5 people · 0.25% initial → up to
              1–3%)
            </div>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {[
                {
                  title: "Head of Innovation",
                  equity: "0.25%→3% · 1v",
                  equityFull: "0.25% → up to 3%",
                  desc: "New products, R&D pipeline, innovation roadmap. 1 vote.",
                  controls: "Innovation team",
                },
                {
                  title: "Head of Strategy",
                  equity: "0.25%→3% · 1v",
                  equityFull: "0.25% → up to 3%",
                  desc: "Global expansion planning, corporate scaling strategy. 1 vote.",
                  controls: "Strategy team",
                },
                {
                  title: "Lead Investor Relations",
                  equity: "0.25%→1% · 1v",
                  equityFull: "0.25% → up to 1%",
                  desc: "Investor communications, funding support. 1 vote.",
                  controls: "IR support team",
                },
                {
                  title: "Head of Corp. Affairs",
                  equity: "0.25%→1% · 1v",
                  equityFull: "0.25% → up to 1%",
                  desc: "Governance, government relations, regulatory policy. 1 vote.",
                  controls: "Corporate affairs",
                },
                {
                  title: "Special Projects Lead",
                  equity: "0.25%→1% · 1v",
                  equityFull: "0.25% → up to 1%",
                  desc: "Cross-functional special initiatives and global scaling projects. 1 vote.",
                  controls: "Project teams",
                },
              ].map((n) => (
                <OrgNode
                  key={n.title}
                  title={n.title}
                  equity={n.equity}
                  equityFull={n.equityFull}
                  type="n-adv"
                  tier="Tier 6 — Advisory"
                  desc={n.desc}
                  controls={n.controls}
                  onNodeClick={click}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div
          className="flex fixed inset-0 bg-black/75 z-[999] items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div className="bg-so-card border border-so-border rounded-[14px] p-6 max-w-[480px] w-[90%] relative">
            <button
              onClick={() => setModal(null)}
              className="absolute top-3 right-3 bg-transparent border border-so-border text-so-muted rounded-md py-1 px-2.5 cursor-pointer font-dm-sans text-xs hover:text-so-text"
            >
              ✕
            </button>
            <div className="font-bebas text-[22px] tracking-[1px] text-so-gold mb-1">
              {modal.title}
            </div>
            <div className="text-[11px] text-so-muted font-dm-mono mb-3">
              {modal.tier} · {modal.equity}
            </div>
            <div className="text-[12.5px] leading-[1.7] text-so-text mb-2.5">
              {modal.desc}
            </div>
            <div className="text-[11px] text-so-green bg-so-green/6 border border-so-green/20 rounded-md py-2 px-3 font-dm-mono">
              Controls / Manages: {modal.controls}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
