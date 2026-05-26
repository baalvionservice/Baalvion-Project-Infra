export default function OwnershipPane() {
  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        FOUNDER <em className="text-so-gold not-italic">OWNERSHIP</em>
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        The parent ownership structure of Baalvion Industries Private Limited.
        This is fixed and does not change with co-founder dilution.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl p-5 relative overflow-hidden bg-gradient-to-br from-so-gold/12 to-so-gold/4 border border-so-gold/40">
          <div className="font-bebas text-[56px] tracking-[2px] leading-none text-so-gold">
            80%
          </div>
          <div className="text-base font-medium mt-1 mb-0.5 text-so-text">
            Allen Krewzz
          </div>
          <div className="text-[11px] text-so-muted">
            Deepak Kuldeep · Founder &amp; Chairman
          </div>
          <div className="text-[11px] font-dm-mono mt-2.5 py-1.5 px-2.5 rounded-md inline-block bg-so-gold/10 text-so-gold border border-so-gold/25">
            Supreme Veto · Can override any decision
          </div>
          <div className="text-[11px] text-so-muted mt-2.5 leading-[1.6]">
            Controls all strategic direction of Baalvion. No co-founder vote,
            board decision, or executive action can override Allen Krewzz&apos;s
            veto. Permanent founder authority.
          </div>
        </div>
        <div className="rounded-xl p-5 relative overflow-hidden bg-gradient-to-br from-so-blue/10 to-so-blue/3 border border-so-blue/35">
          <div className="font-bebas text-[56px] tracking-[2px] leading-none text-so-blue">
            20%
          </div>
          <div className="text-base font-medium mt-1 mb-0.5 text-so-text">
            Dilip Kuldeep
          </div>
          <div className="text-[11px] text-so-muted">
            Co-Founder &amp; Strategic Partner
          </div>
          <div className="text-[11px] font-dm-mono mt-2.5 py-1.5 px-2.5 rounded-md inline-block bg-so-blue/10 text-so-blue border border-so-blue/25">
            Votes proportional to 20% stake
          </div>
          <div className="text-[11px] text-so-muted mt-2.5 leading-[1.6]">
            Strategic partner and co-founder. Votes in proportion to stake on
            key decisions. Does not have executive operating role — advisory and
            governance function.
          </div>
        </div>
      </div>

      <div className="rounded-[10px] p-3.5 mb-4 text-[12.5px] leading-[1.7] border bg-so-gold/5 border-so-gold/20">
        <strong className="text-so-gold">Important:</strong> The 80% + 20% above
        is the PARENT ownership of Baalvion Industries Pvt. Ltd. When
        co-founders are given 0.25% each (total ~7.5%), this dilutes BOTH Allen
        Krewzz and Dilip Kuldeep proportionally. After full co-founder dilution:
        Allen Krewzz ≈ 74%, Dilip Kuldeep ≈ 18.5%, 30 Co-Founders ≈ 7.5% total.
      </div>

      <div className="bg-so-card border border-so-border rounded-[10px] p-4 mb-5">
        <h3 className="text-[13px] font-medium mb-2 text-so-gold">
          Post-Dilution Ownership Table (After All 30 Co-Founders Given 0.25%
          Each)
        </h3>
        <div className="flex justify-between items-center py-1.5 border-b border-so-dim/60 text-xs">
          <span>Allen Krewzz (pre-dilution)</span>
          <span className="font-dm-mono text-[11px] text-so-gold">80.00%</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-so-dim/60 text-xs">
          <span>Dilip Kuldeep (pre-dilution)</span>
          <span className="font-dm-mono text-[11px] text-so-blue">20.00%</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-so-dim/60 text-xs">
          <span>30 × Co-Founders @ 0.25% each</span>
          <span className="font-dm-mono text-[11px] text-so-green">
            7.50% total
          </span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-so-dim/60 text-[11px] text-so-muted">
          <span className="pl-3">Allen Krewzz (post-dilution, approx)</span>
          <span className="font-dm-mono text-[11px] text-so-gold">~74.00%</span>
        </div>
        <div className="flex justify-between items-center py-1.5 border-b border-so-dim/60 text-[11px] text-so-muted">
          <span className="pl-3">Dilip Kuldeep (post-dilution, approx)</span>
          <span className="font-dm-mono text-[11px] text-so-blue">~18.50%</span>
        </div>
        <div className="flex justify-between items-center pt-2.5 font-medium text-[13px]">
          <span>TOTAL</span>
          <span className="font-dm-mono text-[11px] text-so-green">100%</span>
        </div>
      </div>

      <div className="rounded-[10px] p-3.5 mb-4 text-[12.5px] leading-[1.7] border bg-so-red/5 border-so-red/20">
        <strong className="text-so-red">Legal note:</strong> All 0.25% grants
        require formal equity transfer documents signed by Allen Krewzz and
        witnessed. No verbal equity grants. Every co-founder must sign a
        Founders Agreement with 4-year vesting (1-year cliff) before receiving
        any equity. Get a corporate lawyer (cost: ₹30,000–₹80,000) to draft
        these documents once.
      </div>
    </div>
  );
}
