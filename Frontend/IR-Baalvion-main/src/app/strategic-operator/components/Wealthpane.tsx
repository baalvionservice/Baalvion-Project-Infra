const wealthCards = [
  {
    val: "₹10 Lakh",
    stake0: "₹2,500",
    stake5: "₹50,000",
    note: "Groundwork stage",
    pct: 2,
  },
  {
    val: "₹1 Crore",
    stake0: "₹25,000",
    stake5: "₹5 Lakh",
    note: "Early traction",
    pct: 8,
  },
  {
    val: "₹10 Crore",
    stake0: "₹2.5 Lakh",
    stake5: "₹50 Lakh",
    note: "Seed funded",
    pct: 18,
  },
  {
    val: "₹100 Crore",
    stake0: "₹25 Lakh",
    stake5: "₹5 Crore",
    note: "Series A",
    pct: 40,
  },
  {
    val: "₹1,000 Crore",
    stake0: "₹2.5 Crore",
    stake5: "₹50 Crore",
    note: "Unicorn",
    pct: 70,
  },
  {
    val: "₹10,000 Crore",
    stake0: "₹25 Crore",
    stake5: "₹500 Crore",
    note: "Decacorn",
    pct: 100,
  },
];

export default function WealthPane() {
  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        WEALTH <em className="text-so-gold not-italic">PROJECTION</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        How much each co-founder&apos;s equity is worth as Baalvion grows. This
        should be shared with every co-founder monthly so they see the financial
        upside of their commitment.
      </div>

      <div className="rounded-[10px] p-3.5 mb-4 text-[12.5px] leading-[1.7] border bg-so-gold/5 border-so-gold/20">
        <strong className="text-so-gold">How to read this:</strong> At 0.25%
        stake, your equity value = Company Valuation × 0.25%. At 5% stake (max
        performance), your equity value = Company Valuation × 5%. These are
        paper values — realized when company is sold, goes public, or pays
        dividends.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
        {wealthCards.map((w, i) => (
          <div
            key={i}
            className="bg-so-card border border-so-border rounded-[10px] p-3.5"
          >
            <div className="text-[11px] text-so-muted mb-1">
              Valuation: <strong className="text-so-text">{w.val}</strong>
            </div>
            <div className="flex justify-between items-baseline mt-1.5">
              <div>
                <div className="font-bebas text-[22px] text-so-blue">
                  {w.stake0}
                </div>
                <div className="text-[10px] text-so-muted mt-0.5">
                  At 0.25% stake
                </div>
              </div>
              <div className="text-right">
                <div className="font-bebas text-[22px] text-so-green">
                  {w.stake5}
                </div>
                <div className="text-[10px] text-so-muted mt-0.5">
                  At 5% (max)
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-so-s2 rounded-sm mt-2 overflow-hidden">
              <div
                className="h-full rounded-sm bg-gradient-to-r from-so-blue to-so-green"
                style={{ width: `${w.pct}%` }}
              />
            </div>
            <div className="text-[10px] text-so-muted mt-1.5 pt-1.5 border-t border-so-border">
              {w.note}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse mb-5 text-xs">
          <thead>
            <tr>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Company Valuation
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                0.25% (initial) Net Worth
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                1% stake Net Worth
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                3% stake Net Worth
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                5% (max) Net Worth
              </th>
              <th className="text-left text-[9px] font-dm-mono tracking-[1px] text-so-muted py-2 px-2.5 border-b border-so-border uppercase bg-so-s2 whitespace-nowrap">
                Stage Notes
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹10 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹2,500
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹10,000
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹30,000
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹50,000
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Groundwork. Company just starting.
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹1 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹25,000
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹1 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹3 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹5 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Early traction. First revenue.
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹10 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹2.5 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹10 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹30 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹50 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Seed funded. Growing fast.
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹100 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹25 Lakh
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹1 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹3 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹5 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Series A. Co-founders recognized.
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹500 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹1.25 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹5 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹15 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹25 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Series B/C. Major growth milestone.
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹1,000 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹2.5 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹10 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹30 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹50 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Unicorn. Co-founder wealth realized.
              </td>
            </tr>
            <tr className="hover:bg-white/[0.015]">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-muted">
                ₹10,000 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-blue">
                ₹25 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹100 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px]">
                ₹300 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-green">
                ₹500 Crore
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted">
                Decacorn. Generational wealth.
              </td>
            </tr>
            <tr className="bg-so-green/4">
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold font-medium">
                Performance 5% stake
              </td>
              <td
                colSpan={3}
                className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-muted"
              >
                Exceptional performers who reach 5% through merit
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 font-dm-mono text-[11px] text-so-gold font-medium">
                ₹30–500 Crore+
              </td>
              <td className="py-2 px-2.5 border-b border-so-dim/50 align-top leading-6 text-[11px] text-so-green">
                Top earners over 4 years
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="rounded-[10px] p-3.5 mt-3 text-[12.5px] leading-[1.7] border bg-so-green/5 border-so-green/20">
        <strong className="text-so-green">Share this table monthly:</strong>{" "}
        Every co-founder should receive a monthly equity update showing current
        company valuation × their current stake = their paper net worth. This
        keeps all 30 co-founders motivated and aligned with company growth. Head
        of CFO manages this monthly report.
      </div>
    </div>
  );
}
