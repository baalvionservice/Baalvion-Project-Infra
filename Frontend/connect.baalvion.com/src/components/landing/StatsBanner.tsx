
'use client';

import React from 'react';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { Users, Briefcase, IndianRupee, TrendingUp } from 'lucide-react';

const stats = [
  {
    label: 'Creators',
    value: 10000,
    suffix: '+',
    icon: Users,
    description: 'Active talent pool'
  },
  {
    label: 'Brands',
    value: 1500,
    suffix: '+',
    icon: Briefcase,
    description: 'Trusted partners'
  },
  {
    label: 'Campaign Value',
    value: 50,
    prefix: '₹',
    suffix: 'Cr+',
    icon: IndianRupee,
    description: 'Managed volume'
  },
  {
    label: 'Success Rate',
    value: 94,
    suffix: '%',
    icon: TrendingUp,
    description: 'Campaign fulfillment'
  }
];

export function StatsBanner() {
  return (
    <section className="bg-slate-950 py-16 border-y border-white/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col items-center text-center space-y-2"
            >
              <div className="bg-primary/10 p-3 rounded-2xl mb-2">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>

              <div className="text-3xl md:text-4xl font-headline font-bold text-white tracking-tight">
                {stat.prefix}
                <CountUp
                  end={stat.value}
                  duration={2.5}
                  enableScrollSpy
                  scrollSpyOnce
                />
                {stat.suffix}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                  {stat.label}
                </span>
                <span className="text-xs text-slate-400 font-light">
                  {stat.description}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
