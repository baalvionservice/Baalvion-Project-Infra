"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  IndianRupee,
  Target,
  ArrowRight,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const ACTIVE_CAMPAIGNS = [
  {
    id: "1",
    brand: "Lumina Tech",
    logo: "https://picsum.photos/seed/brand-1/100/100",
    title: "The Future of Remote Work: AI Tools",
    budget: "₹50,000 - ₹80,000",
    niche: "Tech & Gadgets",
    deadline: "12 Days left",
    spots: 3,
    isNew: true,
    description:
      "Looking for tech creators to review our latest AI-powered productivity suite.",
  },
  {
    id: "2",
    brand: "EcoVibe",
    logo: "https://picsum.photos/seed/brand-2/100/100",
    title: "Sustainable Summer Fashion Launch",
    budget: "₹25,000 - ₹45,000",
    niche: "Fashion & Style",
    deadline: "8 Days left",
    spots: 5,
    isNew: true,
    description:
      "Showcase our 100% organic hemp collection in your summer lifestyle reels.",
  },
  {
    id: "3",
    brand: "FitFlow",
    logo: "https://picsum.photos/seed/brand-3/100/100",
    title: "30-Day Morning Yoga Challenge",
    budget: "₹35,000 - ₹60,000",
    niche: "Fitness & Wellness",
    deadline: "5 Days left",
    spots: 2,
    isNew: false,
    description:
      "Collaborate with FitFlow to lead a virtual yoga series for our community.",
  },
  {
    id: "4",
    brand: "Azure Skincare",
    logo: "https://picsum.photos/seed/brand-4/100/100",
    title: "Luxury Night Routine Campaign",
    budget: "₹80,000 - ₹1,50,000",
    niche: "Beauty & Personal Care",
    deadline: "15 Days left",
    spots: 4,
    isNew: false,
    description:
      "Premium skincare creators needed for high-aesthetic night-time routine content.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
};

export function ActiveCampaigns() {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 px-3 py-1">
              Live Feed
            </Badge>
            <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">
              Explore Active Campaigns
            </h2>
            <p className="text-muted-foreground text-lg">
              Fresh collaborations are added every hour. Discover brands looking
              for your unique voice and style.
            </p>
          </div>
          <Button
            variant="outline"
            className="hidden md:flex rounded-full group"
          >
            View All Campaigns
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {ACTIVE_CAMPAIGNS.map((campaign) => (
            <motion.div key={campaign.id} variants={itemVariants}>
              <Card className="h-full flex flex-col border-slate-200 hover:border-primary/40 transition-all duration-300 hover:shadow-xl bg-white group">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="relative h-12 w-12 rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                      <Image
                        src={campaign.logo}
                        alt={campaign.brand}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {campaign.isNew && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-headline font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-primary font-bold mt-1">
                    {campaign.brand}
                  </p>
                </CardHeader>

                <CardContent className="p-6 pt-2 flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                    {campaign.description}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-emerald-500" />
                      <span className="font-semibold">{campaign.budget}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        {campaign.niche}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-muted-foreground">
                        {campaign.deadline}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0 mt-auto">
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Users className="h-3.5 w-3.5" />
                      <span>{campaign.spots} SPOTS LEFT</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-bold hover:text-primary p-0 h-auto flex items-center gap-1 group/btn"
                    >
                      Apply Now{" "}
                      <ExternalLink className="h-3 w-3 group-hover/btn:scale-110 transition-transform" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 text-center md:hidden">
          <Button variant="outline" className="w-full rounded-full group">
            View All Campaigns
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
