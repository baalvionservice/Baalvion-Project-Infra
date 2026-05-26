function VoteDots({ count, color }: { count: number; color: string }) {
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {Array.from({ length: Math.min(count, 20) }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

export default function VotingPane() {
  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        VOTING <em className="text-so-gold not-italic">SYSTEM</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        Weighted voting by tier ensures strategic decisions are fast even with
        30 leaders. Allen Krewzz holds supreme veto over all votes.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 mb-5">
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-gold">
          <h3 className="text-xs font-medium mb-2 text-so-gold">
            👑 Allen Krewzz — Founder
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-gold">
            ∞
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-so-gold" />
            <span className="text-[10px] text-so-muted ml-1">Supreme Veto</span>
          </div>
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            Can override ANY vote at ANY time. No co-founder combination can
            outvote Allen Krewzz.
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-blue">
          <h3 className="text-xs font-medium mb-2 text-so-blue">
            🤝 Dilip Kuldeep — Partner
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-blue">
            20
          </div>
          <VoteDots count={20} color="#4f9eff" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            Proportional to 20% ownership stake. Votes on strategic decisions.
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-gold">
          <h3 className="text-xs font-medium mb-2 text-so-gold">
            Tier 1 — Core Exec (×5)
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-gold">
            10
          </div>
          <VoteDots count={10} color="#e8c547" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            10 votes each · 50 votes total across all 5 executives
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-blue">
          <h3 className="text-xs font-medium mb-2 text-so-blue">
            Tier 2 — Tech Leads (×8)
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-blue">
            6
          </div>
          <VoteDots count={6} color="#4f9eff" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            6 votes each · 48 votes total across all 8 tech leads
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-green">
          <h3 className="text-xs font-medium mb-2 text-so-green">
            Tier 3 — Operations (×5)
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-green">
            3
          </div>
          <VoteDots count={3} color="#22d3a5" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            3 votes each · 15 votes total across operations leads
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-orange">
          <h3 className="text-xs font-medium mb-2 text-so-orange">
            Tier 4 — Marketing (×5)
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-orange">
            2
          </div>
          <VoteDots count={2} color="#fb923c" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            2 votes each · 10 votes total across marketing leads
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-pink">
          <h3 className="text-xs font-medium mb-2 text-so-pink">
            Tier 5 — Regional (×5)
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-pink">
            1
          </div>
          <VoteDots count={1} color="#f472b6" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            1 vote each · 5 votes total across regional leads
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-[10px] p-3.5 border-l-[3px] border-l-so-purple">
          <h3 className="text-xs font-medium mb-2 text-so-purple">
            Tier 6 — Advisory (×5)
          </h3>
          <div className="font-bebas text-[32px] tracking-[1px] leading-none text-so-purple">
            1
          </div>
          <VoteDots count={1} color="#a78bfa" />
          <div className="text-[11px] text-so-muted mt-1.5 font-dm-mono">
            1 vote each · 5 votes total across advisory members
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-5 text-xs">
          <thead>
            <tr>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Tier
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                People
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Votes Each
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Total Votes
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                % of All Votes
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Decision Power
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-gold border-so-gold/30 bg-so-gold/7">
                  Founder Allen Krewzz
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                1
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                Supreme Veto
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                ∞
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                Overrides all
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Final word on everything
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-gold border-so-gold/30 bg-so-gold/7">
                  Dilip Kuldeep
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                1
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                20
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                20
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                15.3%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Strategic board-level decisions
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-gold border-so-gold/30 bg-so-gold/7">
                  Core Exec — Tier 1
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                10
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold">
                50
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                38.2%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Operational &amp; strategic decisions
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-blue border-so-blue/30 bg-so-blue/7">
                  Tech Leads — Tier 2
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                8
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                6
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                48
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                36.6%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Technology direction decisions
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-green border-so-green/25 bg-so-green/6">
                  Operations — Tier 3
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                3
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                15
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                11.5%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Department-level decisions
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-orange border-so-orange/25 bg-so-orange/6">
                  Marketing — Tier 4
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange">
                2
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-orange">
                10
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                7.6%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Campaign &amp; growth decisions
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-pink border-so-pink/25 bg-so-pink/6">
                  Regional — Tier 5
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink">
                1
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-pink">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                3.8%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Regional execution decisions
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                <span className="inline-block text-[9px] font-dm-mono py-0.5 px-2 rounded border text-so-purple border-so-purple/25 bg-so-purple/6">
                  Advisory — Tier 6
                </span>
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple">
                1
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-purple">
                5
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                3.8%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px]">
                Advisory input, no blocking power
              </td>
            </tr>
            <tr className="bg-so-green/4">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-medium">
                TOTAL VOTES (excl. veto)
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                31
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6">
                —
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green font-medium">
                153
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                100%
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-green">
                Full company voting power
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-[10px] p-3.5 mt-3 text-[12.5px] leading-[1.7] border bg-so-gold/5 border-so-gold/20">
        <strong className="text-so-gold">Decision thresholds:</strong> Simple
        majority (50%+1 vote) for operational decisions. Super majority (67%)
        for structural changes. Allen Krewzz&apos;s supreme veto applies to ALL
        decisions regardless of vote outcome. Dilip Kuldeep has 20 votes
        proportional to his stake — equivalent to 2 Tier 1 executives combined.
      </div>
    </div>
  );
}
