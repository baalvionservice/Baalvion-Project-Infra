"use client";

import { useState } from "react";

const monthlyTemplate = `BAALVION INDUSTRIES — MONTHLY CO-FOUNDER EQUITY REPORT
Month: [Month Year]
Prepared by: CFO, Baalvion Industries
════════════════════════════════════════

COMPANY STATUS
Current Valuation (estimated): ₹[X] Crore
Current Month Revenue: ₹[X]
MoM Growth: [X]%
Platforms Live: 4 (ir.baalvion.com, mining.baalvion.com, imperialpedia.com, baalvionstack.com)

════════════════════════════════════════
OWNERSHIP STRUCTURE
Founder & Chairman (Allen Krewzz): 80% → ₹[valuation × 0.80] Crore
Strategic Partner (Dilip Kuldeep): 20% → ₹[valuation × 0.20] Crore
30 Co-Founders (combined): ~7.5% → ₹[valuation × 0.075] Crore

════════════════════════════════════════
YOUR EQUITY UPDATE — [Co-Founder Name]
Role: [Their Title]
Tier: [Tier Number]

Initial equity grant: 0.25%
Performance equity earned to date: [X]%
Current total equity: [X]%
Vesting status: [X months completed / 48 months]
Equity vested so far: [X]%

PAPER NET WORTH TODAY:
At 0.25% stake: ₹[valuation × 0.0025] Crore
At current [X]% stake: ₹[valuation × X] Crore

WEALTH MILESTONES:
→ When Baalvion reaches ₹100 Crore: Your 0.25% = ₹25 Lakh
→ When Baalvion reaches ₹1,000 Crore: Your 0.25% = ₹2.5 Crore
→ With 5% performance stake at ₹1,000 Crore: ₹50 Crore

════════════════════════════════════════
PERFORMANCE EQUITY STATUS
Last annual review: [Date]
Next annual review: [Date]
Current performance score: [X/10]
Equity earned this year: [+X%]
Remaining equity available to earn (this year): [X%]

════════════════════════════════════════
CO-FOUNDER RECOGNITION STATUS (Google & PR)
Google results for "[Your Name] Baalvion": [X results]
LinkedIn followers: [X]
Press articles this month: [X]
Press articles total: [X]

————————————————————————————————————
Questions? Contact: cfr@baalvion.com | ceo@baalvion.com
Baalvion Industries Pvt. Ltd. | CIN: U43121OD2025PTC048479
Founder: Allen Krewzz (Deepak Kuldeep) | Partner: Dilip Kuldeep`;

export default function MonthlyPane() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(monthlyTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="font-bebas text-[26px] tracking-[1.5px] mb-1">
        MONTHLY EQUITY <em className="text-so-gold not-italic">REPORT</em> —
        Template
      </div>
      <div className="text-[13px] text-so-muted mb-5 leading-[1.65] max-w-[760px]">
        The CFO sends this to all 30 co-founders on the 1st of every month.
        Shows current company valuation, their stake, and their paper net worth.
        Keeps all co-founders motivated and aligned.
      </div>

      <div className="relative bg-black/40 border border-so-border rounded-lg p-3.5 text-xs font-dm-mono leading-[1.85] text-[#b8cfe0] mb-3.5 whitespace-pre-wrap">
        <button
          className="absolute top-2.5 right-2.5 bg-so-gold text-black border-none rounded-md font-dm-sans text-[10px] font-bold py-1 px-2.5 cursor-pointer hover:bg-so-gold/90"
          onClick={handleCopy}
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
        {monthlyTemplate}
      </div>

      <div className="rounded-[10px] p-3.5 mt-3 text-[12.5px] leading-[1.7] border bg-so-blue/5 border-so-blue/20">
        <strong className="text-so-blue">
          Send this every month without fail.
        </strong>{" "}
        Co-founders who can see their equity growing in real numbers stay
        motivated. Co-founders who only hear &quot;we are growing&quot; without
        numbers eventually lose faith. The monthly report is the single most
        powerful retention tool for a 30-co-founder company.
      </div>
    </div>
  );
}
