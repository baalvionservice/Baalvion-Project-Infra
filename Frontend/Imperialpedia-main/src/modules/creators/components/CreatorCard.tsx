"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/design-system/typography/text";
import { CreatorProfile } from "@/types";
import { ShieldCheck, Users, BookOpen, ArrowRight, Award } from "lucide-react";

interface CreatorCardProps {
  creator: CreatorProfile;
}

/**
 * Enhanced Expert Contributor Card.
 * Displays professional title, verified status, and credibility badges.
 */
export const CreatorCard = ({ creator }: CreatorCardProps) => {
  return (
    <Link href={`/creator/${creator.id}`} className="group block h-full">
      <Card className="glass-card flex flex-col h-full overflow-hidden transition-all duration-500 hover:translate-y-[-6px] hover:shadow-2xl hover:border-primary/40 relative">
        <CardHeader className="p-6 pb-2 flex flex-row items-start gap-4">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-primary/30 transition-colors shrink-0">
            <Image
              src={creator.avatar}
              alt={creator.displayName}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Text
                variant="body"
                weight="bold"
                className="truncate text-lg group-hover:text-primary transition-colors"
              >
                {creator.displayName}
              </Text>
              {creator.verified && (
                <div title="Verified Expert">
                  <ShieldCheck className="h-4 w-4 text-secondary shrink-0" />
                </div>
              )}
            </div>
            <Text
              variant="caption"
              className="text-primary font-bold uppercase tracking-widest text-[9px] mb-1 block"
            >
              {creator.title}
            </Text>
            <Text
              variant="caption"
              className="text-muted-foreground truncate block"
            >
              @{creator.username}
            </Text>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2 flex-grow">
          <Text
            variant="bodySmall"
            className="text-muted-foreground line-clamp-3 mb-6 leading-relaxed"
          >
            {creator.bio}
          </Text>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {creator.badges?.slice(0, 2).map((badge) => (
              <Badge
                key={badge}
                variant="outline"
                className="border-secondary/20 bg-secondary/5 text-secondary text-[8px] font-bold uppercase h-5 px-2"
              >
                <Award className="w-2.5 h-2.5 mr-1" /> {badge}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {creator.specialties.slice(0, 3).map((spec) => (
              <Badge
                key={spec}
                variant="secondary"
                className="bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-tighter border-none"
              >
                {spec}
              </Badge>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 mt-auto border-t border-white/5 flex items-center justify-between text-muted-foreground bg-card/10">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest pt-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{(creator.stats.followersCount / 1000).toFixed(1)}k</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-secondary" />
              <span>{creator.stats.articlesCount}</span>
            </div>
          </div>
          <div className="pt-4">
            <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
