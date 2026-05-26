"use client";

import { motion } from "framer-motion";

const rows = [
  { feature: "Real-world skill tasks", ours: "Always included", theirs: "Resume only", theirsGood: false },
  { feature: "Objective performance scoring", ours: "AI-powered", theirs: "Gut-feel interviews", theirsGood: false },
  { feature: "Verified skills & badges", ours: "Auto-verified", theirs: "Self-reported only", theirsGood: false },
  { feature: "Live competitive leaderboard", ours: "Real-time", theirs: "Not available", theirsGood: false },
  { feature: "Average time to hire", ours: "6 days", theirs: "41 days", theirsGood: false },
  { feature: "Average cost per hire", ours: "$2,900", theirs: "$11,000+", theirsGood: false },
  { feature: "Bias-free candidate discovery", ours: "Data-driven", theirs: "Name/school bias", theirsGood: false },
  { feature: "Analytics dashboard", ours: "Full insights", theirs: "Spreadsheets only", theirsGood: false },
];

export default function CompareSection() {
  return (
    <div className="bg-gray-50 py-[88px] px-6">
      <div className="max-w-[880px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            Comparison
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            SkillMatch Pro vs the rest
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            How we stack up against traditional hiring methods.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Header */}
          <div className="grid grid-cols-3 bg-gray-50 border-b-2 border-gray-200">
            <div className="px-[18px] py-3.5 text-xs font-bold text-gray-500 uppercase tracking-[0.5px]">
              Feature
            </div>
            <div className="px-[18px] py-3.5 text-xs font-bold uppercase tracking-[0.5px] bg-green-50 text-green-800 border-l-2 border-r-2 border-green-600 text-center">
              ✓ SkillMatch Pro
            </div>
            <div className="px-[18px] py-3.5 text-xs font-bold text-gray-500 uppercase tracking-[0.5px]">
              Traditional hiring
            </div>
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div
              key={row.feature}
              className="grid grid-cols-3 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="px-[18px] py-3 text-xs font-medium flex items-center gap-1.5 text-gray-700">
                {row.feature}
              </div>
              <div className="px-[18px] py-3 text-xs flex items-center justify-center gap-1.5 font-semibold bg-[hsl(142,76%,36%,0.04)] border-l-2 border-r-2 border-green-600">
                <span className="text-green-600 text-sm">✓</span> {row.ours}
              </div>
              <div className={`px-[18px] py-3 text-xs flex items-center gap-1.5 ${row.theirsGood ? "" : "text-red-500"}`}>
                <span className="text-red-400 text-sm">✗</span> {row.theirs}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
