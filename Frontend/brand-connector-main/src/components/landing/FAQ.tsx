'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Building2, UserCircle2 } from 'lucide-react';

const BRAND_FAQS = [
  {
    question: "How does the escrow payment system work?",
    answer: "Our secure escrow system holds your campaign budget safely once you hire a creator. Funds are only released to the creator after you've reviewed and approved the final deliverables, ensuring total peace of mind for your marketing spend."
  },
  {
    question: "How are creators verified on Baalvion?",
    answer: "Every creator undergoes a multi-step verification process. We verify their social media ownership, analyze their historical engagement data to detect bot activity, and review their past professional collaborations to ensure high-quality standards."
  },
  {
    question: "What is the AI Matching Engine and how accurate is it?",
    answer: "Our proprietary AI analyzes millions of data points, including audience demographics, content sentiment, and historical ROI. It matches brands with creators whose audience perfectly aligns with their target market, achieving up to 95% higher engagement compared to manual searching."
  },
  {
    question: "Can I set specific campaign requirements and deliverables?",
    answer: "Absolutely. When creating a campaign, you can define exact deliverables (e.g., 1 Reel, 2 Stories), specific keywords to use, content format requirements, and even visual guidelines to ensure brand consistency."
  },
  {
    question: "How do I track the ROI of my influencer campaigns?",
    answer: "Baalvion provides a real-time analytics dashboard for every campaign. Track clicks, conversions, total reach, and cost-per-acquisition (CPA) directly within the platform using our integrated tracking tools."
  },
  {
    question: "Are there any long-term contracts or hidden fees?",
    answer: "No. Baalvion operates on a transparent per-campaign basis. We have clear monthly subscription tiers for advanced features, but there are no hidden fees or long-term lock-ins. You pay for what you use."
  }
];

const CREATOR_FAQS = [
  {
    question: "When and how do I get paid for my work?",
    answer: "Payments are processed automatically once the brand approves your submitted deliverables. The funds are already in escrow, so you never have to chase invoices. You can withdraw your earnings via Bank Transfer, PayPal, or Stripe."
  },
  {
    question: "How does Baalvion match me with relevant brand campaigns?",
    answer: "Our AI considers your niche, audience location, engagement style, and previous campaign success. You'll receive invitations to campaigns that genuinely fit your brand, making every collaboration more authentic and effective."
  },
  {
    question: "Is it free for creators to join and apply for campaigns?",
    answer: "Yes, it is 100% free for creators to join Baalvion, build a professional portfolio, and apply to campaigns. We only take a small platform fee from the final payment to cover secure transaction costs."
  },
  {
    question: "What happens if a brand requests multiple revisions?",
    answer: "Our platform guidelines specify a standard number of revisions (usually one). If a brand requires more, our support team can mediate or help you adjust the project scope and budget accordingly through our built-in messaging system."
  },
  {
    question: "Can I manage multiple social media accounts from one profile?",
    answer: "Yes! You can connect and manage all your major social platforms—Instagram, YouTube, TikTok, LinkedIn, and more—from a single Baalvion dashboard, giving brands a complete view of your cross-platform reach."
  },
  {
    question: "How does the rating system affect my visibility to brands?",
    answer: "Creators who consistently deliver on time and receive positive feedback from brands earn higher ratings. Higher-rated creators are prioritized in our AI matching engine and are more likely to be featured in 'Top Talent' showcases."
  }
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <Badge className="mb-4 bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200 px-3 py-1">
            Support Center
          </Badge>
          <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px]">
            Everything you need to know about working with Baalvion Connect.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="brands" className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-14 p-1 rounded-2xl bg-slate-100/50">
                <TabsTrigger value="brands" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  For Brands
                </TabsTrigger>
                <TabsTrigger value="creators" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg font-bold flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" />
                  For Creators
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="brands">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {BRAND_FAQS.map((faq, idx) => (
                    <AccordionItem key={idx} value={`brand-${idx}`} className="border rounded-2xl px-6 bg-slate-50/30 hover:bg-slate-50 transition-colors border-slate-200/60 shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-6 text-left font-headline font-bold text-lg text-slate-900">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-md leading-relaxed pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </TabsContent>

            <TabsContent value="creators">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {CREATOR_FAQS.map((faq, idx) => (
                    <AccordionItem key={idx} value={`creator-${idx}`} className="border rounded-2xl px-6 bg-slate-50/30 hover:bg-slate-50 transition-colors border-slate-200/60 shadow-sm">
                      <AccordionTrigger className="hover:no-underline py-6 text-left font-headline font-bold text-lg text-slate-900">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-md leading-relaxed pb-6">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-headline font-bold">Still have questions?</h3>
              <p className="text-muted-foreground">Can't find the answer you're looking for? Our team is here to help.</p>
            </div>
          </div>
          <button className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
}
