"use client";

import { motion, type Variants } from "framer-motion";
import BarChartCard from "./BarChartCard";

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};
const fadeRight: Variants = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1px] px-3 py-[3px] rounded-full mb-3">
      {children}
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5 mt-0 list-none p-0">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
          <div className="w-[19px] h-[19px] rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5 text-green-600 text-[10px] font-black">
            ✓
          </div>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function DataProof() {
  return (
    <div id="proof" className="bg-white py-[88px] px-6">
      <div className="max-w-[1120px] mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            Proven results
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            The data speaks for itself
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            Real metrics from companies using ControlTheMarket vs traditional methods.
          </p>
        </motion.div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center mb-[60px]">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <BarChartCard
              title="Average time to hire (days)"
              badge="↓ 85% faster"
              bars={[
                { label: "Traditional", widthPct: 97, color: "hsl(220,10%,78%)", value: "41d" },
                { label: "Resume-based", widthPct: 29, color: "hsl(221,83%,70%)", value: "12d" },
                { label: "ControlTheMarket", widthPct: 15, color: "hsl(142,76%,36%)", value: "6d", valueColor: "hsl(142,76%,36%)" },
              ]}
              miniStats={[
                { value: "85%", valueColor: "hsl(142,76%,36%)", label: "Faster than industry avg.", trend: "↑ vs traditional hiring", trendUp: true },
                { value: "$8,200", valueColor: "hsl(221,83%,53%)", label: "Saved per hire avg.", trend: "↑ per role filled", trendUp: true },
              ]}
            />
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="px-1.5"
          >
            <SectionTag>Time to hire</SectionTag>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-black tracking-[-0.8px] leading-[1.18] mb-3 text-gray-900">
              Fill roles in <span className="text-green-600">6 days</span>, not 6 weeks.
            </h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-[18px]">
              Traditional hiring drags on for 41+ days. Resume screening, mismatched interviews, and gut-feel decisions waste everyone's time. ControlTheMarket cuts through with real performance data.
            </p>
            <CheckList
              items={[
                "Skip resume screening — go straight to proven skills",
                "Objective scoring replaces subjective interviews",
                "Leaderboard shows top candidates instantly",
                "AI pre-scores every submission automatically",
              ]}
            />
          </motion.div>
        </div>

        {/* Row 2 - flipped */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center mb-[60px]">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="px-1.5 order-2 md:order-1"
          >
            <SectionTag>Quality of hire</SectionTag>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-black tracking-[-0.8px] leading-[1.18] mb-3 text-gray-900">
              Hire people who actually <span className="text-green-600">deliver results.</span>
            </h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-[18px]">
              An impressive resume is not the same as impressive work. ControlTheMarket's verified performance data means you always know what you're getting before making an offer.
            </p>
            <CheckList
              items={[
                "92% of ControlTheMarket hires still with company at 12 months",
                "3.2× higher quality vs traditional job boards",
                "Verified badges eliminate resume inflation completely",
                "Objective data reduces unconscious hiring bias",
              ]}
            />
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="order-1 md:order-2"
          >
            <BarChartCard
              title="Quality of hire score (out of 100)"
              badge="↑ 3.2× better"
              bars={[
                { label: "Job boards", widthPct: 31, color: "hsl(0,60%,72%)", value: "31" },
                { label: "Recruiter", widthPct: 54, color: "hsl(221,83%,70%)", value: "54" },
                { label: "Referrals", widthPct: 78, color: "hsl(40,90%,60%)", value: "78" },
                { label: "ControlTheMarket", widthPct: 97, color: "hsl(142,76%,36%)", value: "97", valueColor: "hsl(142,76%,36%)" },
              ]}
              miniStats={[
                { value: "97/100", valueColor: "hsl(142,76%,36%)", label: "Avg. quality score", trend: "↑ vs 31 on job boards", trendUp: true },
                { value: "92%", valueColor: "hsl(221,83%,53%)", label: "Still employed at 12mo", trend: "↑ vs 67% industry", trendUp: true },
              ]}
            />
          </motion.div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[60px] items-center">
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <BarChartCard
              title="Average cost per hire (USD)"
              badge="↓ 68% cheaper"
              bars={[
                { label: "Executive search", widthPct: 95, color: "hsl(0,60%,72%)", value: "$28K" },
                { label: "Agency recruiter", widthPct: 70, color: "hsl(30,80%,65%)", value: "$18K" },
                { label: "Job boards", widthPct: 42, color: "hsl(221,83%,70%)", value: "$8.4K" },
                { label: "ControlTheMarket", widthPct: 22, color: "hsl(142,76%,36%)", value: "$2.9K", valueColor: "hsl(142,76%,36%)" },
              ]}
              miniStats={[
                { value: "$2,900", valueColor: "hsl(142,76%,36%)", label: "Average cost per hire", trend: "↓ 68% vs industry avg.", trendUp: true },
                { value: "$8,200", valueColor: "hsl(221,83%,53%)", label: "Average saving per role", trend: "↑ directly to profit", trendUp: true },
              ]}
            />
          </motion.div>

          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="px-1.5"
          >
            <SectionTag>Cost efficiency</SectionTag>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-black tracking-[-0.8px] leading-[1.18] mb-3 text-gray-900">
              Hire better for <span className="text-green-600">68% less money.</span>
            </h2>
            <p className="text-sm text-gray-500 leading-[1.7] mb-[18px]">
              Agency fees, subscriptions, and weeks of recruiter time add up fast. ControlTheMarket automates the heavy lifting so your team only spends time on the very best performers.
            </p>
            <CheckList
              items={[
                "No agency fees — hire directly from leaderboard",
                "AI pre-scoring saves 40+ hours per role",
                "Fewer bad hires means lower replacement costs",
                "Flat monthly pricing — no per-hire surprises",
              ]}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
