'use client';

import React from 'react';
import { Follower } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/design-system/typography/text';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface FollowerCardProps {
  follower: Follower;
}

/**
 * A card representing a creator network connection.
 */
export function FollowerCard({ follower }: FollowerCardProps) {
  return (
    <Card className="glass-card hover:border-primary/40 transition-all group relative overflow-hidden">
      <Link href={`/creator/${follower.username}`} className="absolute inset-0 z-0" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 rounded-2xl border-2 border-white/5 group-hover:border-primary/30 transition-colors shrink-0">
            <AvatarImage src={follower.profileImage} />
            <AvatarFallback>{follower.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <Text variant="body" weight="bold" className="truncate group-hover:text-primary transition-colors">
                {follower.name}
              </Text>
              {follower.category && (
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase">
                  {follower.category}
                </Badge>
              )}
            </div>
            <Text variant="caption" className="text-muted-foreground truncate block">
              @{follower.username}
            </Text>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <Clock className="h-3 w-3" />
          Joined {format(new Date(follower.followedAt), 'MMM yyyy')}
        </div>
      </CardContent>
    </Card>
  );
}
