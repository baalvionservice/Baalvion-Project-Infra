"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface CounterProps {
  target: number;
  suffix: string;
  label: string;
  sub: string;
}

function Counter({ target, suffix, label, sub }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    const duration = 1800;
    const step = (target / duration) * 16;
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(Math.round(current));
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <div ref={ref} className="text-center">
      <div>
        <span className="text-[50px] font-black text-white leading-none tracking-[-2px]">
          {target >= 1000 ? count.toLocaleString() : count}
        </span>
        <span className="text-[50px] font-black text-white/70 tracking-[-1px]">
          {suffix}
        </span>
      </div>
      <div className="text-[13px] text-white/70 mt-1.5 font-medium">{label}</div>
      <div className="text-[11px] text-white/45 mt-0.5">{sub}</div>
    </div>
  );
}

const stats = [
  { target: 2400, suffix: "+", label: "Companies hiring", sub: "across 40+ countries" },
  { target: 48000, suffix: "+", label: "Verified candidates", sub: "proven through real tasks" },
  { target: 6, suffix: " days", label: "Average time to hire", sub: "vs 41 days industry avg." },
  { target: 94, suffix: "%", label: "Hiring satisfaction", sub: "rated by company HRs" },
];

export default function StatsSection() {
  return (
    <div className="bg-green-600 py-[68px] px-6 relative overflow-hidden">
      <div
        className="absolute top-[-80px] right-[-80px] w-[380px] h-[380px] bg-white/6 rounded-full pointer-events-none"
      />
      <div className="max-w-[1100px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-9 relative z-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
          >
            <Counter {...s} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
