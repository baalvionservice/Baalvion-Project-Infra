'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Instagram, 
  Youtube, 
  Linkedin, 
  Music2, 
  Users, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Real creators only.
 *
 * Six invented profiles sat here — "Alex Rivers @alex_gaming" and five more — with
 * follower counts, engagement rates, match scores and picsum placeholder headshots,
 * presented on the public landing page as "Featured Talent" and described as "verified
 * creators who have a proven track record". None are on the platform.
 *
 * That is a claim about who you can hire here, so it is emptied rather than relabelled.
 * The section renders nothing until real, consenting creators can be listed.
 */
type ShowcaseCreator = {
  id: string;
  name: string;
  handle: string;
  niche: string[];
  followers: string;
  er: string;
  platform: string;
  icon: LucideIcon;
  image: string;
  matchScore: number;
  color: string;
};

const TOP_CREATORS: ShowcaseCreator[] = [];

const CreatorItem = memo(({ creator, index }: { creator: ShowcaseCreator, index: number }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1 }}
    className="break-inside-avoid mb-6"
  >
    <Card className="group overflow-hidden border-slate-200 hover:border-primary/40 transition-all duration-300 hover:shadow-2xl">
      <CardContent className="p-0 relative">
        <div className="relative w-full overflow-hidden aspect-[4/5]">
          <Image 
            src={creator.image} 
            alt={creator.name} 
            fill 
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            loading="lazy"
          />
          
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Zap className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-xs font-black text-primary">{creator.matchScore}% Match</span>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg">
              <creator.icon className={`h-5 w-5 ${creator.color}`} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-headline font-bold text-lg">{creator.name}</h4>
                <CheckCircle2 className="h-4 w-4 text-blue-500 fill-blue-500/10" />
              </div>
              <p className="text-sm text-primary font-medium">{creator.handle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {creator.niche.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Users className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Followers</span>
              </div>
              <span className="font-bold text-slate-900">{creator.followers}</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Avg. ER</span>
              </div>
              <span className="font-bold text-slate-900">{creator.er}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
));

CreatorItem.displayName = 'CreatorItem';

export function CreatorShowcase() {
  // Omitted entirely while there is no real talent to feature.
  if (TOP_CREATORS.length === 0) return null;

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1">
            Featured Talent
          </Badge>
          <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">
            Discover Top-Tier Creators
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px]">
            Work with verified creators who have a proven track record of high engagement and professional deliverables.
          </p>
        </div>

        <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
          {TOP_CREATORS.map((creator, i) => (
            <CreatorItem key={creator.id} creator={creator} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
