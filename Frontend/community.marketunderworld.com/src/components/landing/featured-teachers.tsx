"use client"

import { motion } from "framer-motion"
import { TEACHERS } from "@/lib/mock-data"
import { TeacherCard } from "@/components/education/teacher-card"
import { NexusButton } from "@/components/ui/nexus-button"
import Link from "next/link"

export const FeaturedTeachers = () => {
  const featured = TEACHERS.slice(0, 6);

  return (
    <section className="py-32 bg-black/20">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 text-center md:text-left">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Elite Private Teachers</h2>
            <p className="text-gray-400 text-lg font-medium">
              Handpicked experts from 49 countries. Book private sessions. Pay in crypto.
            </p>
          </div>
          <Link href="/education">
            <NexusButton variant="outline" className="hidden md:flex border-white/10 hover:bg-white/5">
              View All 343 Teachers
            </NexusButton>
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-8 no-scrollbar pb-8 -mx-6 px-6">
          {featured.map((teacher, idx) => (
            <motion.div 
              key={teacher.id} 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="min-w-[320px] md:min-w-[380px]"
            >
              <TeacherCard teacher={teacher} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link href="/education">
            <NexusButton variant="outline" className="w-full border-white/10">
              View All 343 Teachers
            </NexusButton>
          </Link>
        </div>
      </div>
    </section>
  )
}
