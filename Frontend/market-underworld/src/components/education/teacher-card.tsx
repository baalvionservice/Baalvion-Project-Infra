"use client"

import { ListingCard, Badge } from "@/components/ui/ListingCard"
import { AppButton } from "@/components/ui/AppButton"
import { Star, Users, Globe } from "lucide-react"
import { Teacher } from "@/lib/types"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface TeacherCardProps {
  teacher: Teacher;
  className?: string;
}

export const TeacherCard = ({ teacher, className }: TeacherCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <ListingCard className="p-0 overflow-hidden border-brand-border bg-brand-surface group hover:border-brand-green transition-all">
        <Link href={`/education/teacher/${teacher.id}`}>
          <div className="relative h-60 bg-brand-void cursor-pointer overflow-hidden">
            <Image
              src={teacher.avatar_url}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              alt={teacher.name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-void to-transparent opacity-60" />
            
            <div className="absolute top-4 left-4 flex gap-2">
              {teacher.is_live && (
                <Badge variant="live" className="bg-brand-void/80 border border-semantic-error/40">
                  LIVE
                </Badge>
              )}
              <Badge variant="info" className="bg-brand-void/80 border border-brand-border">
                {teacher.regionId.toUpperCase()}
              </Badge>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getFlagEmoji(teacher.countryCode)}</span>
                <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">{teacher.country}</span>
              </div>
            </div>
          </div>
        </Link>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <Link href={`/education/teacher/${teacher.id}`}>
              <div className="cursor-pointer space-y-1">
                <div className="text-[10px] font-bold text-brand-green uppercase tracking-widest font-mono">{teacher.subject}</div>
                <h4 className="text-lg font-bold text-text-primary group-hover:text-brand-green transition-colors">
                  {teacher.name}
                </h4>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary font-mono">
              <Star className="w-3.5 h-3.5 text-semantic-warning fill-semantic-warning" /> 
              {teacher.rating}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {(teacher.tags ?? []).map(tag => (
              <Badge key={tag} className="text-[9px] font-bold font-mono">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-6 text-text-muted">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase font-mono">
              <Users className="w-3.5 h-3.5" /> 
              {(teacher.students_count ?? 0).toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase font-mono">
              <Globe className="w-3.5 h-3.5" /> 
              {teacher.regionId.toUpperCase()}
            </span>
          </div>

          <div className="pt-6 border-t border-brand-border flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Rate</div>
              <div className="font-bold text-sm text-brand-green font-mono">
                {teacher.price_crypto} {teacher.currency}
                <span className="text-text-muted text-[11px] font-medium ml-1.5">(${teacher.price_usd})</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/education/teacher/${teacher.id}`}>
                <AppButton variant="secondary" size="sm" className="h-8">
                  Profile
                </AppButton>
              </Link>
              <Link href={`/education/teacher/${teacher.id}?tab=booking`}>
                <AppButton size="sm" className="h-8">
                  Book
                </AppButton>
              </Link>
            </div>
          </div>
        </div>
      </ListingCard>
    </motion.div>
  )
}

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
