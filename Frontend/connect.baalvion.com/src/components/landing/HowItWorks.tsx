'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  PlusCircle, 
  Zap, 
  ShieldCheck, 
  CheckCircle, 
  UserPlus, 
  Users, 
  FileUp, 
  Wallet,
  ArrowRight
} from 'lucide-react';

const brandSteps = [
  {
    title: "Create Campaign",
    desc: "Define your goals, budget, and target audience in minutes.",
    icon: PlusCircle,
  },
  {
    title: "AI Matches Creators",
    desc: "Our engine identifies the best creators based on real performance data.",
    icon: Zap,
  },
  {
    title: "Fund Escrow",
    desc: "Secure your budget. Funds are held safely until you're satisfied.",
    icon: ShieldCheck,
  },
  {
    title: "Approve & Pay",
    desc: "Review deliverables and release payment with one click.",
    icon: CheckCircle,
  }
];

const creatorSteps = [
  {
    title: "Build Profile",
    desc: "Connect your socials and showcase your best performing content.",
    icon: UserPlus,
  },
  {
    title: "Get Matched",
    desc: "Receive invitations to campaigns that fit your niche and style.",
    icon: Users,
  },
  {
    title: "Deliver Content",
    desc: "Collaborate directly with brands and submit your creative work.",
    icon: FileUp,
  },
  {
    title: "Get Paid",
    desc: "Receive guaranteed payments instantly upon approval.",
    icon: Wallet,
  }
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-[700px] mx-auto">
            A seamless experience designed to take the friction out of influencer marketing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative">
          {/* Decorative center line for desktop */}
          <div className="hidden lg:block absolute left-1/2 top-24 bottom-24 w-px bg-slate-100 -translate-x-1/2" />

          {/* Brand Flow */}
          <div className="space-y-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-primary/10 p-2 rounded-lg">
                <ArrowRight className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-2xl font-headline font-bold">For Brands</h3>
            </div>
            
            <div className="space-y-12 relative">
              {brandSteps.map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-6 relative group"
                >
                  {/* Connector Line */}
                  {idx !== brandSteps.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-[-48px] w-0.5 bg-slate-100 group-hover:bg-primary/30 transition-colors" />
                  )}
                  
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-all duration-300">
                    <step.icon className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold mb-1">{step.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Creator Flow */}
          <div className="space-y-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <ArrowRight className="h-5 w-5 text-secondary" />
              </div>
              <h3 className="text-2xl font-headline font-bold">For Creators</h3>
            </div>

            <div className="space-y-12 relative">
              {creatorSteps.map((step, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-6 relative group"
                >
                  {/* Connector Line */}
                  {idx !== creatorSteps.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-[-48px] w-0.5 bg-slate-100 group-hover:bg-secondary/30 transition-colors" />
                  )}
                  
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center group-hover:border-secondary group-hover:text-secondary transition-all duration-300">
                    <step.icon className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-bold mb-1">{step.title}</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
