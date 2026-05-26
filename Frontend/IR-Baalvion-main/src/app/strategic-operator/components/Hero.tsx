export default function Hero() {
  return (
    <div className="bg-so-s1 border-b border-so-border pt-9 pr-7 pb-7 pl-7 relative overflow-hidden">
      {/* Radial gradient background */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-radial from-so-gold/6 to-transparent rounded-full pointer-events-none"></div>

      <div className="font-dm-mono text-[10px] tracking-[3px] text-so-gold uppercase mb-3">
        Baalvion Industries Private Limited · Corrected &amp; Complete · 2026
      </div>

      <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl leading-[0.95] tracking-[2px] mb-3">
        <em className="text-so-gold not-italic">30 CO-FOUNDER</em>
        <br />
        <span className="text-so-blue">CORRECTED</span> MASTER
        <br />
        BLUEPRINT
      </h1>

      <div className="text-[13px] text-so-muted max-w-[700px] leading-[1.7] mb-6">
        Revised ownership (Allen Krewzz 80% · Dilip Kuldeep 20%), corrected
        equity (0.25% initial per co-founder), performance-based growth to 3–5%,
        wealth projections at every company valuation milestone, and full PR
        recognition plan for all 30.
      </div>

      <div className="flex gap-2.5 flex-wrap">
        <div className="bg-so-card border border-so-border rounded-lg py-2.5 px-4 min-w-[110px]">
          <div className="font-bebas text-2xl tracking-[1px] text-so-gold">
            80%
          </div>
          <div className="text-[9px] font-dm-mono tracking-[1px] text-so-muted uppercase mt-0.5">
            Allen Krewzz
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-lg py-2.5 px-4 min-w-[110px]">
          <div className="font-bebas text-2xl tracking-[1px] text-so-blue">
            20%
          </div>
          <div className="text-[9px] font-dm-mono tracking-[1px] text-so-muted uppercase mt-0.5">
            Dilip Kuldeep
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-lg py-2.5 px-4 min-w-[110px]">
          <div className="font-bebas text-2xl tracking-[1px] text-so-green">
            0.25%
          </div>
          <div className="text-[9px] font-dm-mono tracking-[1px] text-so-muted uppercase mt-0.5">
            Each Co-Founder
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-lg py-2.5 px-4 min-w-[110px]">
          <div className="font-bebas text-2xl tracking-[1px] text-so-orange">
            ~7.5%
          </div>
          <div className="text-[9px] font-dm-mono tracking-[1px] text-so-muted uppercase mt-0.5">
            Total Diluted
          </div>
        </div>
        <div className="bg-so-card border border-so-border rounded-lg py-2.5 px-4 min-w-[110px]">
          <div className="font-bebas text-2xl tracking-[1px] text-so-purple">
            5%
          </div>
          <div className="text-[9px] font-dm-mono tracking-[1px] text-so-muted uppercase mt-0.5">
            Max Performance
          </div>
        </div>
      </div>
    </div>
  );
}
