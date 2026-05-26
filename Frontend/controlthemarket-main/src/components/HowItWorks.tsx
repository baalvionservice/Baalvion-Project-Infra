"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "1",
    title: "Take the task",
    desc: "Candidates choose real-world challenges created by companies and submit their best work — no cover letters, no guessing games.",
  },
  {
    n: "2",
    title: "Get evaluated",
    desc: "AI scores every submission against objective criteria, providing clear, unbiased performance data your team can trust.",
  },
  {
    n: "3",
    title: "Get discovered",
    desc: "Top performers rank on live leaderboards. Companies reach out directly — no middlemen, no guesswork, just results.",
  },
];

export default function HowItWorks() {
  return (
    <div id="hiw" className="bg-gray-100 py-[88px] px-6">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            How it works
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            Simple. Transparent. Effective.
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            Three steps that replace an entire broken hiring process.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-gray-200 rounded-2xl overflow-hidden shadow-sm"
        >
          {steps.map((step) => (
            <div
              key={step.n}
              className="bg-white px-[26px] py-[30px] hover:bg-gray-50 transition-colors"
            >
              <div className="w-[46px] h-[46px] rounded-[13px] bg-green-600 text-white text-[20px] font-black flex items-center justify-center mb-[18px]">
                {step.n}
              </div>
              <h3 className="text-[18px] font-black mb-2 tracking-[-0.3px] text-gray-900">
                {step.title}
              </h3>
              <p className="text-sm text-gray-500 leading-[1.65]">{step.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
