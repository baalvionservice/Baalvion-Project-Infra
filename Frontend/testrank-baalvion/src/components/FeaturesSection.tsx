"use client";

import { motion } from "framer-motion";

const features = [
  { icon: "🎯", title: "Real-world tasks", desc: "Practical, role-specific challenges instead of cover letters. See exactly what candidates can do." },
  { icon: "📊", title: "Data-driven analytics", desc: "Objective insights into candidate performance and skill levels across every submission — automatically." },
  { icon: "🏆", title: "Live leaderboards", desc: "Top performers ranked in real time, creating a constantly refreshed pool of proven ready-to-hire talent." },
  { icon: "✅", title: "Verified profiles", desc: "Skills validated through actual task performance — not self-reported claims or inflated CVs." },
  { icon: "🏅", title: "Trust badges", desc: "Candidates earn verifiable badges for achievements, building credibility across every application." },
  { icon: "🤖", title: "AI-powered insights", desc: "AI pre-scores and surfaces only the top candidates so your team reviews the best — fast." },
];

export default function FeaturesSection() {
  return (
    <div id="feats" className="bg-white py-[88px] px-6">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            Platform features
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            Built on trust and performance
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            Every feature designed to make skill-based hiring effortless.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px]">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.6 }}
              className="border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:-translate-y-1 hover:border-green-600 transition-all group bg-white"
            >
              <div className="w-[46px] h-[46px] rounded-xl bg-green-50 flex items-center justify-center mb-3.5 text-[20px] group-hover:scale-110 transition-transform">
                {feat.icon}
              </div>
              <h3 className="text-[15px] font-bold mb-1.5 text-gray-900">{feat.title}</h3>
              <p className="text-[13px] text-gray-500 leading-[1.65]">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
