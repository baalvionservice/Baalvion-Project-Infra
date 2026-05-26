"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "0",
    desc: "For individuals and small teams getting started.",
    features: [
      "Up to 5 active job posts",
      "Candidate leaderboard access",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get started free",
    ctaStyle: "outline" as const,
    featured: false,
  },
  {
    name: "Pro",
    price: "79",
    desc: "For growing companies who want the full experience.",
    features: [
      "Unlimited job posts",
      "Full leaderboard + filters",
      "Advanced analytics",
      "AI-powered scoring",
      "Trust badges & verified profiles",
      "Priority support",
    ],
    cta: "Start free trial",
    ctaStyle: "solid" as const,
    featured: true,
  },
  {
    name: "Enterprise",
    price: null,
    desc: "For large orgs with advanced needs and integrations.",
    features: [
      "Everything in Pro",
      "Custom ATS integrations",
      "Dedicated account manager",
      "SSO & advanced security",
      "SLA guarantee",
    ],
    cta: "Contact sales",
    ctaStyle: "outline" as const,
    featured: false,
  },
];

export default function Pricing() {
  return (
    <div id="pricing" className="bg-gray-100 py-[88px] px-6">
      <div className="max-w-[980px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block bg-green-50 text-green-800 text-[10px] font-black uppercase tracking-[1.2px] px-3 py-[3px] rounded-full mb-3">
            Pricing
          </div>
          <h2 className="text-[clamp(26px,4vw,40px)] font-black tracking-[-1px] leading-[1.15] mb-2.5 text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[500px] mx-auto">
            Start free. Scale as you grow. No hidden fees ever.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px] items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className={`bg-white rounded-2xl p-7 relative hover:-translate-y-1 transition-transform ${
                plan.featured
                  ? "border-2 border-green-600 shadow-[0_0_0_4px_hsl(142,76%,36%,0.09)]"
                  : "border border-gray-200"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-[11px] left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-black px-3.5 py-[3px] rounded-full uppercase tracking-[0.5px] whitespace-nowrap">
                  Most popular
                </div>
              )}

              <div className="text-[10px] font-black uppercase tracking-[1.5px] text-gray-400 mb-2">
                {plan.name}
              </div>

              {plan.price !== null ? (
                <div className="text-[40px] font-black tracking-[-1.5px] leading-none mb-1.5">
                  <sup className="text-[18px] align-top mt-2.5 inline-block font-bold">$</sup>
                  {plan.price}
                  <span className="text-sm font-medium text-gray-400">/mo</span>
                </div>
              ) : (
                <div className="text-[34px] font-black tracking-[-0.5px] leading-none mb-1.5">
                  Custom
                </div>
              )}

              <p className="text-[13px] text-gray-500 mb-5 leading-[1.55]">{plan.desc}</p>

              <ul className="flex flex-col gap-2 mb-5 list-none p-0">
                {plan.features.map((f) => (
                  <li key={f} className="text-[13px] flex items-center gap-1.5">
                    <div className="w-[15px] h-[15px] rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 text-[9px] text-green-600 font-black">
                      ✓
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="#"
                className={`w-full flex items-center justify-center px-[18px] py-[9px] text-sm font-semibold rounded-lg transition-all no-underline ${
                  plan.ctaStyle === "solid"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-transparent text-green-600 border-[1.5px] border-green-600 hover:bg-green-600 hover:text-white"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
