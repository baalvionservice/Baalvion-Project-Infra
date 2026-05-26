'use client';

import React, { useState } from 'react';
import { Follower } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface FollowerCardProps {
  follower: Follower;
}

/**
 * A professional card representing an expert connection.
 * Handles interactive follow/unfollow states within the creator network.
 */
export function FollowerCard({ follower }: FollowerCardProps) {
  const [status, setStatus] = useState<"following" | "not_following">(follower.status);

  const toggleFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus(status === 'following' ? 'not_following' : 'following');
  };

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
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase">
                {follower.category || 'Expert'}
              </Badge>
            </div>
            <Text variant="caption" className="text-muted-foreground truncate block">
              @{follower.username}
            </Text>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            Joined {format(new Date(follower.followedAt), 'MMM yyyy')}
          </div>
          
          <Button 
            size="sm" 
            variant={status === 'following' ? "outline" : "default"}
            className="h-8 px-4 rounded-xl font-bold text-xs relative z-20"
            onClick={toggleFollow}
          >
            {status === 'following' ? (
              <><UserMinus className="mr-1.5 h-3.5 w-3.5" /> Unfollow</>
            ) : (
              <><UserPlus className="mr-1.5 h-3.5 w-3.5" /> Follow</>
            )}
          </Button>
        </div>
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-4 w-4 text-primary/40" />
        </div>
      </CardContent>
    </Card>
  );
}
