"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CTASection() {
  return (
    <div className="bg-gray-900 py-24 px-6 text-center relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(34,197,94,0.14) 0%, transparent 70%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-[620px] mx-auto relative z-10"
      >
        <h2 className="text-[clamp(32px,4.5vw,50px)] font-black text-white tracking-[-1.5px] leading-[1.1] mb-3.5">
          Ready to <em className="text-green-500 not-italic">control the market</em>?
        </h2>
        <p className="text-base text-white/55 mb-9 leading-[1.65]">
          Whether you're looking for the best talent or want to prove you are the best — your journey starts at controlthemarket.com
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="#"
            className="inline-flex items-center justify-center px-[34px] py-[14px] text-[17px] font-semibold bg-green-600 text-white rounded-[14px] hover:bg-green-700 transition-all no-underline"
          >
            Prove your skills →
          </Link>
          <Link
            href="#"
            className="inline-flex items-center justify-center px-[32px] py-[13px] text-[17px] font-semibold rounded-[14px] border-[1.5px] border-white/25 text-white bg-white/12 hover:bg-white/22 backdrop-blur-md transition-all no-underline"
          >
            Find top talent
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
