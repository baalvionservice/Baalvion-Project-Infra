"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-white px-6 pt-24 pb-20 text-center relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220,15%,88%) 1px, transparent 1px), linear-gradient(90deg, hsl(220,15%,88%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-80px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "600px",
          background:
            "radial-gradient(ellipse, hsl(142,76%,36%,0.09) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 bg-green-50 text-green-800 text-[13px] font-bold px-3 py-1 rounded-full mb-6 border border-green-200"
          style={{ paddingLeft: "7px" }}
        >
          <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-[11px]">
            ✓
          </div>
          The future of hiring is here
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[clamp(38px,6.5vw,68px)] font-black leading-[1.08] tracking-[-2px] mb-5 max-w-[860px] mx-auto text-gray-900"
        >
          Hire by{" "}
          <span className="text-green-600 relative inline-block">
            Skill
            <span
              className="absolute bottom-[-4px] left-0 h-[3px] bg-green-600 rounded-sm"
              style={{ animation: "drawLine 1s 0.5s ease forwards", width: 0 }}
            />
          </span>
          ,<br />
          Not by Resume.
        </motion.h1>

        <style>{`@keyframes drawLine { to { width: 100%; } }`}</style>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[18px] text-gray-500 max-w-[520px] mx-auto mb-9 leading-[1.65]"
        >
          The proof-of-skill ecosystem where top companies discover verified
          talent based on real-world performance — not paper.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex gap-3 justify-center flex-wrap mb-11"
        >
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-[34px] py-[14px] text-[17px] font-semibold bg-green-600 text-white rounded-[14px] hover:bg-green-700 hover:-translate-y-px transition-all shadow-[0_4px_12px_rgba(34,197,94,0.3)] no-underline"
          >
            Start hiring now →
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center px-[34px] py-[14px] text-[17px] font-semibold bg-transparent text-green-600 border-[1.5px] border-green-600 rounded-[14px] hover:bg-green-600 hover:text-white transition-all no-underline"
          >
            Prove your skills
          </Link>
        </motion.div>

        {/* Trust proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-4 flex-wrap mb-14"
        >
          {[
            "No credit card required",
            "Free 14-day trial",
            "2,400+ companies trust us",
          ].map((text, i) => (
            <div key={text} className="flex items-center gap-1">
              {i > 0 && (
                <div className="w-1 h-1 rounded-full bg-gray-300 mr-3" />
              )}
              <span className="text-green-600 text-[13px]">✓</span>
              <span className="text-[13px] text-gray-500">{text}</span>
            </div>
          ))}
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="max-w-[920px] mx-auto mt-12 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_hsl(220,15%,88%)] overflow-hidden bg-white"
          style={{ animation: "float 4s ease-in-out infinite" }}
        >
          <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }`}</style>

          {/* Browser bar */}
          <div className="bg-gray-100 px-3 sm:px-4 py-2.5 flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            <div className="flex-1 bg-white rounded-[5px] h-[22px] mx-2 sm:mx-3 flex items-center px-2 sm:px-2.5 text-[10px] sm:text-[11px] text-gray-400 font-mono overflow-hidden">
              <span className="truncate">controlthemarket.com/dashboard</span>
            </div>
          </div>

          {/* Body */}
          <div className="sm:grid sm:grid-cols-[200px_1fr]">
            {/* Sidebar */}
            <div className="bg-gray-50 border-r border-gray-200 p-3.5 flex-col gap-1 hidden sm:flex">
              {[
                { icon: "📊", label: "Dashboard", active: true },
                { icon: "🏆", label: "Leaderboard" },
                { icon: "📝", label: "Tasks" },
                { icon: "👥", label: "Candidates" },
                { icon: "🔒", label: "Verified" },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`px-2.5 py-[7px] rounded-[7px] text-[11px] font-medium flex items-center gap-1.5 ${
                    item.active
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  {item.icon} {item.label}
                </div>
              ))}
            </div>

            {/* Main */}
            <div className="p-3 sm:p-4">
              <div className="text-xs font-bold mb-3 text-gray-900">
                Hiring Dashboard — Frontend Engineer
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-3">
                {[
                  { n: "1,284", l: "Applicants", g: "↑ 18%" },
                  { n: "8,432", l: "Tasks done", g: "↑ 24%" },
                  { n: "6 days", l: "Time to hire", g: "↓ 73%" },
                  { n: "94%", l: "Satisfaction", g: "↑ 12%" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="bg-gray-50 rounded-[7px] p-2 sm:p-2.5 border border-gray-200"
                  >
                    <div className="text-sm sm:text-[17px] font-black text-gray-900">
                      {s.n}
                    </div>
                    <div className="text-[7px] sm:text-[8px] text-gray-400 uppercase tracking-wide mt-0.5">
                      {s.l}
                    </div>
                    <div className="text-[8px] sm:text-[9px] text-green-600 font-semibold mt-0.5">
                      {s.g}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-gray-50 rounded-[7px] p-2.5 border border-gray-200 mb-3">
                <div className="flex items-end gap-1 h-[50px]">
                  {[30, 45, 28, 55, 40, 35, 63, 82, 90, 100].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${
                        i >= 7 ? "bg-green-600" : "bg-gray-200"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="bg-gray-50 rounded-[7px] border border-gray-200 overflow-hidden">
                <div className="px-2.5 py-1.5 text-[10px] font-bold border-b border-gray-200 flex justify-between text-gray-900">
                  Top performers{" "}
                  <span className="text-green-600 text-[9px]">
                    Live leaderboard →
                  </span>
                </div>
                {[
                  {
                    rank: "#1",
                    initials: "JS",
                    name: "Jordan S.",
                    score: 97,
                    bg: "hsl(221,83%,88%)",
                    col: "hsl(221,83%,40%)",
                    gold: true,
                  },
                  {
                    rank: "#2",
                    initials: "AL",
                    name: "Aisha L.",
                    score: 94,
                    bg: "hsl(142,76%,88%)",
                    col: "hsl(142,76%,30%)",
                    gold: true,
                  },
                  {
                    rank: "#3",
                    initials: "MK",
                    name: "Marcus K.",
                    score: 91,
                    bg: "hsl(280,70%,88%)",
                    col: "hsl(280,70%,35%)",
                    gold: false,
                  },
                ].map((row) => (
                  <div
                    key={row.rank}
                    className="px-2.5 py-1.5 flex items-center gap-1.5 border-b border-gray-200 last:border-0 text-[10px]"
                  >
                    <div
                      className={`font-black w-4 text-[9px] ${
                        row.gold ? "text-amber-500" : "text-gray-400"
                      }`}
                    >
                      {row.rank}
                    </div>
                    <div
                      className="w-[22px] h-[22px] rounded-full text-[8px] font-black flex items-center justify-center flex-shrink-0"
                      style={{ background: row.bg, color: row.col }}
                    >
                      {row.initials}
                    </div>
                    <div className="flex-1 font-semibold">{row.name}</div>
                    <div className="bg-green-50 text-green-800 text-[8px] font-bold px-1 py-0.5 rounded">
                      Verified
                    </div>
                    <div className="font-black text-[11px] text-green-600">
                      {row.score}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
