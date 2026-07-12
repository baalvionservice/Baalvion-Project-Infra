"use client"

import { motion } from "framer-motion"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { MessageSquare, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

const THREADS = [
  { title: "Best crypto wallets for students in 2025", forum: "East Asia Forum", replies: 142, isVip: false },
  { title: "How I passed IELTS with a NEXUS teacher", forum: "Europe Forum", replies: 89, isVip: false },
  { title: "Top coding bootcamps vs private teachers", forum: "North America Forum", replies: 203, isVip: false },
  { title: "Exclusive: Advanced trading methods [VIP]", forum: "Global Strategy", replies: 56, isVip: true },
]

export const ForumsPreview = () => {
  return (
    <section className="py-32">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 tracking-tight">Join the Conversation</h2>
          <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Region-specific forums. Expert discussions. Exclusive paid sessions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 gap-6">
          {THREADS.map((thread, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Link href="/forums">
                <NexusCard className="group flex items-center justify-between hover:border-blue-200 p-8">
                  <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${thread.isVip ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                      {thread.isVip ? <Lock className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors ${thread.isVip ? 'text-amber-600' : 'text-gray-900'}`}>
                        {thread.title}
                      </h4>
                      <div className="flex items-center gap-4 text-[13px] font-semibold text-gray-400">
                        <span>{thread.forum}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <span>{thread.replies} Replies</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-200 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                </NexusCard>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <Link href="/forums">
            <NexusButton size="lg" variant="outline" className="px-12 bg-white">
              Enter the Forums
            </NexusButton>
          </Link>
        </div>
      </div>
    </section>
  )
}
