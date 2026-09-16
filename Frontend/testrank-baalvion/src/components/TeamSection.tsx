"use client";

import { motion } from "framer-motion";

const team = [
  {
    initials: "AK",
    name: "Alex Kim",
    role: "CEO & Co-founder",
    bio: "Former Head of Engineering at Stripe. Built hiring systems used by 10,000+ companies.",
    bg: "hsl(221,83%,88%)",
    col: "hsl(221,83%,40%)",
  },
  {
    initials: "SR",
    name: "Sofia R.",
    role: "CTO & Co-founder",
    bio: "PhD in ML from MIT. Previously led AI research at LinkedIn's talent intelligence team.",
    bg: "hsl(142,76%,88%)",
    col: "hsl(142,76%,30%)",
  },
  {
    initials: "JL",
    name: "James L.",
    role: "Head of Product",
    bio: "10 years building HR tech. Shipped products used by Fortune 500 recruiting teams.",
    bg: "hsl(280,70%,88%)",
    col: "hsl(280,70%,35%)",
  },
  {
    initials: "MP",
    name: "Maya P.",
    role: "Head of Growth",
    bio: "Scaled two B2B SaaS companies from 0 to $10M ARR. Obsessed with data and metrics.",
    bg: "hsl(35,90%,88%)",
    col: "hsl(35,90%,30%)",
  },
];

export default function TeamSection() {
  return (
    <div id="team" className="bg-white py-[88px] px-6">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            Our team
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            Built by people who've been there
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            We've been on both sides of the hiring table. We built ControlTheMarket to fix it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[18px]">
          {team.map((member, i) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="border border-gray-200 rounded-2xl p-[22px] text-center hover:shadow-md hover:-translate-y-1 transition-all group bg-white"
            >
              <div
                className="w-16 h-16 rounded-full mx-auto mb-3 font-black text-[20px] flex items-center justify-center group-hover:scale-105 transition-transform"
                style={{ background: member.bg, color: member.col }}
              >
                {member.initials}
              </div>
              <div className="text-sm font-bold mb-0.5 text-gray-900">{member.name}</div>
              <div className="text-[11px] text-gray-400 mb-2">{member.role}</div>
              <div className="text-xs text-gray-500 leading-[1.6]">{member.bio}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
