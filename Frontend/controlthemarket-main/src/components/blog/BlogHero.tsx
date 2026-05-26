"use client";

import { motion } from "framer-motion";

interface BlogHeroProps {
  search: string;
  onSearch: (v: string) => void;
}

export default function BlogHero({ search, onSearch }: BlogHeroProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 pt-16 pb-12 text-center relative overflow-hidden">
      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220,15%,88%) 1px,transparent 1px),linear-gradient(90deg,hsl(220,15%,88%) 1px,transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-60px", left: "50%", transform: "translateX(-50%)",
          width: "700px", height: "400px",
          background: "radial-gradient(ellipse,hsl(142,76%,36%,0.08) 0%,transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 max-w-[600px] mx-auto"
      >
        <div className="text-[10px] font-black uppercase tracking-[2px] text-green-600 mb-2.5">
          SkillMatch Pro Blog
        </div>
        <h1 className="text-[clamp(30px,5vw,52px)] font-black tracking-[-1.5px] mb-3 text-gray-900 leading-tight">
          Insights on{" "}
          <span className="text-green-600">Skill-Based</span> Hiring
        </h1>
        <p className="text-base text-gray-500 max-w-[520px] mx-auto mb-7 leading-[1.65]">
          Expert guides, data-backed research, and thought leadership on the
          future of talent verification and recruitment.
        </p>

        {/* Search */}
        <div className="relative max-w-[460px] mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full px-4 py-3 pr-12 rounded-[10px] border-[1.5px] border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-green-600 transition-colors font-[inherit]"
          />
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            🔍
          </span>
        </div>
      </motion.div>
    </div>
  );
}
