const perfCards = [
  {
    icon: "🏆",
    title: "Tier 1 — Core Exec KPIs",
    color: "#e8c547",
    perf: "+1.25%/year",
    cap: "5%",
    kpis: [
      "CEO: Revenue growth % + investor meetings + team satisfaction score",
      "COO: Operational efficiency + cost reduction + process improvements",
      "CFO: Fundraising targets + financial model accuracy + cost management",
      "CTO: Platform uptime + delivery speed + tech team performance",
      "CMO: User growth + brand reach + PR coverage count",
    ],
  },
  {
    icon: "💻",
    title: "Tier 2 — Tech Leads KPIs",
    color: "#4f9eff",
    perf: "+1%/year",
    cap: "5%",
    kpis: [
      "Delivery: Features shipped on time vs planned",
      "Quality: Bug rate, uptime, performance benchmarks",
      "Team: Team growth, hiring quality, retention",
      "Innovation: New solutions implemented, patents, ideas shipped",
      "Cross-team: Collaboration score from peer reviews",
    ],
  },
  {
    icon: "⚙️",
    title: "Tier 3 — Operations KPIs",
    color: "#22d3a5",
    perf: "+0.75%/year",
    cap: "3%",
    kpis: [
      "HR: Hiring speed, offer acceptance rate, attrition rate",
      "Legal: Zero compliance violations, contract turnaround time",
      "Admin: Cost savings, vendor management quality",
      "Supply Chain: Delivery accuracy for Mining platform",
      "Customer Success: NPS score, retention rate, support resolution time",
    ],
  },
  {
    icon: "📢",
    title: "Tier 4 — Marketing KPIs",
    color: "#fb923c",
    perf: "+0.75%/year",
    cap: "3%",
    kpis: [
      "Marketing: Campaign ROI, brand awareness growth",
      "Growth: User acquisition cost, retention rate improvement",
      "PR: Press articles published, media reach, journalist relationships",
      "Social: Follower growth, engagement rate, viral content",
      "Partnerships: Deals closed, revenue from partnerships",
    ],
  },
  {
    icon: "🗺️",
    title: "Tier 5 — Regional KPIs",
    color: "#f472b6",
    perf: "+0.75%/year",
    cap: "3%",
    kpis: [
      "Market penetration % in their region",
      "Revenue generated from their regional market",
      "Key partnerships established in region",
      "Press coverage achieved in local regional media",
      "Investor introductions from their region",
    ],
  },
  {
    icon: "🧠",
    title: "Tier 6 — Advisory KPIs",
    color: "#a78bfa",
    perf: "+0.25%/year",
    cap: "1–3%",
    kpis: [
      "Innovation: New products/ideas that get approved and shipped",
      "Strategy: Expansion plans adopted and executed",
      "IR: Investor introductions that lead to term sheets",
      "Corporate: Governance improvements, policy implementations",
      "Special Projects: Milestones achieved on assigned initiatives",
    ],
  },
];

export default function PerformancePane() {
  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        PERFORMANCE-BASED{" "}
        <em className="text-so-gold not-italic">EQUITY GROWTH</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        Co-founders start at 0.25% and can earn additional equity up to 3–5%
        over 4 years based on measurable performance. This is reviewed annually
        by Allen Krewzz and the CEO.
      </div>

      <div className="rounded-[10px] p-3.5 mb-4 text-[12.5px] leading-[1.7] border bg-so-gold/5 border-so-gold/20">
        <strong className="text-so-gold">How performance equity works:</strong>{" "}
        Each year, co-founders are assessed on KPIs specific to their role.
        Exceptional performers earn 0.5–1% additional equity per year (up to 4
        years). Total maximum = 0.25% initial + up to 4.75% performance = 5% cap
        for Tier 1–2. Tier 3–6 cap at 3%.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        {perfCards.map((card) => (
          <div
            key={card.title}
            className="bg-so-card border border-so-border rounded-[10px] p-4 border-l-[3px]"
            style={{ borderLeftColor: card.color }}
          >
            <h3 className="text-[13px] font-medium mb-1.5 flex items-center gap-2">
              {card.icon} {card.title}
            </h3>
            <p className="text-xs text-so-muted leading-[1.6]">
              Performance equity: up to{" "}
              <strong style={{ color: card.color }}>{card.perf}</strong> · Cap:{" "}
              {card.cap}
            </p>
            <div className="mt-2.5 flex flex-col gap-1">
              {card.kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="text-[11px] flex gap-1.5 items-start text-so-text py-0.5 border-b border-so-dim/50 last:border-b-0"
                >
                  <span className="text-so-green text-[10px] flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  {kpi}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-5 text-xs">
          <thead>
            <tr>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Tier
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Initial Equity
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Year 1 Max Add
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Year 2 Max Add
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Year 3 Max Add
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Year 4 Max Add
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Total Max (4yr)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-gold border-so-gold/30 bg-so-gold/7">
                  Tier 1 Exec
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                +1.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                +1.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                +1.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                +1.00%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green font-medium">
                5.00% cap
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-blue border-so-blue/30 bg-so-blue/7">
                  Tier 2 Tech
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                +1.00%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                +1.00%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                +1.00%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green font-medium">
                5.00% cap
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-green border-so-green/25 bg-so-green/6">
                  Tier 3 Ops
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                +0.50%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green font-medium">
                3.00% cap
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-orange border-so-orange/25 bg-so-orange/6">
                  Tier 4 Mktg
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange">
                +0.50%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange font-medium">
                3.00% cap
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-pink border-so-pink/25 bg-so-pink/6">
                  Tier 5 Regional
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink">
                +0.75%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink">
                +0.50%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink font-medium">
                3.00% cap
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-purple border-so-purple/25 bg-so-purple/6">
                  Tier 6 Advisory
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple">
                +0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple">
                +0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple">
                +0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple">
                +0.25%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple font-medium">
                1.25% max
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
