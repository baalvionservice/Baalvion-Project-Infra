"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck, Lock, Radar, KeyRound, Eye, ScrollText,
  Check, X, ChevronDown,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GridBackground } from "@/components/access/grid-background";
import { TierCard, type TierCardData } from "@/components/access/tier-card";
import { PaymentModal, type AccessTierPlan } from "@/components/access/payment-modal";
import { getCommunity, type MembershipStatus } from "@/lib/api/community";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

const TIERS: (TierCardData & { slug: string; redirectTo: string })[] = [
  {
    level: "Access Tier 1",
    name: "Marketplace Access",
    priceLabel: "$100 USD",
    slug: "marketplace-access",
    redirectTo: "/marketplace",
    ctaLabel: "Deposit $100 & Unlock Marketplace",
    features: [
      "Full Marketplace Access",
      "Browse Global Listings",
      "Buy & Sell Products",
      "Regional Trade Nodes",
      "Secure Escrow Transactions",
      "Trade Dashboard",
      "Wallet Integration",
    ],
  },
  {
    level: "Access Tier 2",
    name: "Global Elite Access",
    priceLabel: "$250 USD",
    slug: "global-elite",
    redirectTo: "/forum",
    ctaLabel: "Deposit $250 & Unlock Full Network",
    tone: "elite",
    badge: "Elite",
    features: [
      "Everything in Marketplace Access, plus:",
      "Community Forums",
      "Private Trading Channels",
      "Premium Intelligence Reports",
      "Verified Vendor Directory",
      "Early Marketplace Access",
    ],
  },
  {
    level: "Access Tier 3",
    name: "VIP Access",
    priceLabel: "$1,000 USD",
    slug: "vip-access",
    redirectTo: "/forum",
    ctaLabel: "Deposit $1,000 & Unlock VIP",
    tone: "vip",
    badge: "VIP",
    features: [
      "Everything in Global Elite Access, plus:",
      "VIP-Only Trading Rooms",
      "Dedicated Account Priority",
      "Highest-Tier Vendor Network",
      "First Access to Every Future Feature",
      "VIP Member Badge",
    ],
  },
];

const SECURITY_BADGES = [
  { icon: ShieldCheck, label: "Blockchain Secured" },
  { icon: Lock, label: "End-to-End Encryption" },
  { icon: KeyRound, label: "Multi-Signature Wallet" },
  { icon: Radar, label: "Automated Verification" },
  { icon: Eye, label: "24/7 Monitoring" },
  { icon: ScrollText, label: "Secure Access Protocol" },
];

const FAQS = [
  {
    q: "Why is a deposit required?",
    a: "The deposit is a one-time membership fee that activates your account at the tier you select. It is not refundable once your access has been granted, and it does not accrue as store credit — it unlocks the features listed for that tier. See our Terms and Refund Policy for the full details.",
  },
  {
    q: "How long does verification take?",
    a: "Usually within a few minutes, once your transaction reaches the required number of blockchain confirmations (3 for BTC, 15 for ETH-BEP20). Your account activates automatically — no manual review, no waiting on support.",
  },
  {
    q: "Which cryptocurrencies are supported?",
    a: "Bitcoin (BTC), USDT on the TRC20 (Tron) network, and ETH on the BEP20 (BNB Smart Chain) network. TRC20 has substantially lower network fees for most users.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes — you can upgrade to any higher tier by depositing the difference between your current tier and the new one. Contact support to initiate an upgrade.",
  },
];

export default function AccessPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, MembershipStatus | "none">>({});
  const [selectedPlan, setSelectedPlan] = useState<AccessTierPlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    Promise.all(TIERS.map((t) => getCommunity(t.slug))).then((results) => {
      const next: Record<string, MembershipStatus | "none"> = {};
      results.forEach((detail, i) => {
        next[TIERS[i].slug] = detail?.membership?.status ?? "none";
      });
      setStatuses(next);
    });
  }, []);

  const statusFor = (slug: string): "member" | "pending" | "none" => {
    const s = statuses[slug];
    if (s === "paid" || s === "approved") return "member";
    if (s === "requested") return "pending";
    return "none";
  };

  const openModal = (tier: (typeof TIERS)[number]) => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Create a free account or sign in before depositing — access tiers are tied to your account." });
      router.push("/auth/signin");
      return;
    }
    setSelectedPlan({ slug: tier.slug, name: tier.name, priceLabel: tier.priceLabel, redirectTo: tier.redirectTo });
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-screen text-white">
      <Navbar />
      <GridBackground />

      {/* Hero */}
      <section className="container mx-auto px-6 pt-44 pb-24 text-center max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-[0.3em] border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> System Online
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            GLOBAL ACCESS<br /><span className="text-emerald-400">PROTOCOL</span>
          </h1>
          <p className="text-xl text-gray-300 font-medium mb-4">
            Secure your access to the world&apos;s largest decentralized marketplace network.
          </p>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Marketplace access is restricted to verified members. Select an access tier, complete
            your deposit in Bitcoin (BTC), USDT (TRC20), or ETH (BEP20), and your account will be
            activated automatically after payment confirmation.
          </p>
        </motion.div>
      </section>

      {/* Tiers */}
      <section className="container mx-auto px-6 pb-24 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TIERS.map((tier) => (
            <TierCard key={tier.slug} tier={tier} status={statusFor(tier.slug)} onSelect={() => openModal(tier)} />
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="container mx-auto px-6 pb-24 max-w-4xl">
        <h2 className="text-2xl font-bold text-center mb-10">Compare Access Tiers</h2>
        <div className="rounded-2xl border border-white/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-left">
                <th className="p-4 font-bold text-gray-400 uppercase text-[11px] tracking-widest">Feature</th>
                <th className="p-4 font-bold text-gray-400 uppercase text-[11px] tracking-widest text-center">$100</th>
                <th className="p-4 font-bold text-emerald-400 uppercase text-[11px] tracking-widest text-center">$250</th>
                <th className="p-4 font-bold text-amber-400 uppercase text-[11px] tracking-widest text-center">$1,000</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ["Marketplace", true, true, true],
                ["Buy & Sell", true, true, true],
                ["Trade Dashboard", true, true, true],
                ["Forums", false, true, true],
                ["Private Communities", false, true, true],
                ["Premium Resources", false, true, true],
                ["VIP Trading Rooms", false, false, true],
                ["Dedicated Priority", false, false, true],
              ].map(([label, a, b, c]) => (
                <tr key={label as string}>
                  <td className="p-4 text-gray-300 whitespace-nowrap">{label as string}</td>
                  <td className="p-4 text-center">{a ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</td>
                  <td className="p-4 text-center">{b ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</td>
                  <td className="p-4 text-center">{c ? <Check className="w-4 h-4 text-amber-400 mx-auto" /> : <X className="w-4 h-4 text-gray-700 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Security badges */}
      <section className="container mx-auto px-6 pb-24 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SECURITY_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <badge.icon className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{badge.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 pb-32 max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={faq.q} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-bold text-sm text-white">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <PaymentModal plan={selectedPlan} open={modalOpen} onOpenChange={setModalOpen} />
      <Footer />
    </div>
  );
}
