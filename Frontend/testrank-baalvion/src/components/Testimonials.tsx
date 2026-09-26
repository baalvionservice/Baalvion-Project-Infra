"use client";

import { motion } from "framer-motion";

/**
 * Real endorsements only.
 *
 * Three invented testimonials sat here — "Jane Doe, Head of Talent, TechCorp", "John Smith"
 * and "Emily White, CTO, Innovate Inc." — quoting results this platform has not produced,
 * under a heading promising "Real results. Real people." The company has no customers yet.
 *
 * The section renders nothing while empty.
 */
type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  bg: string;
  col: string;
};
const testimonials: Testimonial[] = [];


export default function Testimonials() {
  if (testimonials.length === 0) return null;
  return (
    <div className="bg-gray-50 py-[88px] px-6">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            Testimonials
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            Loved by top companies & candidates
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            Real results. Real people. Real transformations.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px]">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="bg-white border border-gray-200 rounded-2xl p-[26px] hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-[1px] mb-3.5">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-900 leading-[1.75] mb-[18px] italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-[38px] h-[38px] rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0"
                  style={{ background: t.bg, color: t.col }}
                >
                  {t.initials}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-gray-900">{t.name}</div>
                  <div className="text-[11px] text-gray-400">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
