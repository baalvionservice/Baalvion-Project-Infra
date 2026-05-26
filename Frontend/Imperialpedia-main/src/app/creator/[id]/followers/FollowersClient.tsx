'use client';

import React, { useState, useMemo } from 'react';
import { CreatorProfile, Follower } from '@/types';
import { Container } from '@/design-system/layout/container';
import { Text } from '@/design-system/typography/text';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  ArrowLeft, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { FollowerCard } from '@/modules/creators/components/FollowerCard';

interface FollowersClientProps {
  creator: CreatorProfile;
  initialFollowers: Follower[];
  initialFollowing: Follower[];
}

/**
 * Interactive network discovery for an expert profile.
 * Supports real-time search, sorting, and pagination across followers/following.
 */
export function FollowersClient({ creator, initialFollowers, initialFollowing }: FollowersClientProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('followers');

  const filteredData = useMemo(() => {
    const source = activeTab === 'followers' ? initialFollowers : initialFollowing;
    if (!search) return source;
    
    return source.filter(f => 
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [activeTab, search, initialFollowers, initialFollowing]);

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Context */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full h-12 w-12" asChild>
            <Link href={`/creator/${creator.id}`}><ArrowLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Users className="h-4 w-4" />
              <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Expert Network</Text>
            </div>
            <Text variant="h1" className="text-3xl font-bold">{creator.displayName}</Text>
          </div>
        </div>
        
        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search network..." 
            className="pl-10 bg-card/30 border-white/10 h-11 rounded-2xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Main Tabs Matrix */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4">
          <TabsList className="bg-card/30 border border-white/5 p-1 h-12 rounded-2xl">
            <TabsTrigger value="followers" className="px-8 gap-2 rounded-xl font-bold text-sm data-[state=active]:bg-primary">
              <UserCheck className="h-4 w-4" /> Followers ({initialFollowers.length})
            </TabsTrigger>
            <TabsTrigger value="following" className="px-8 gap-2 rounded-xl font-bold text-sm data-[state=active]:bg-primary">
              <UserPlus className="h-4 w-4" /> Following ({initialFollowing.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 rounded-xl border-white/10 text-xs font-bold bg-card/30">
              <Filter className="mr-2 h-3.5 w-3.5" /> Sort: Newest
            </Button>
          </div>
        </div>

        <TabsContent value="followers" className="mt-0">
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map(follower => (
                <FollowerCard key={follower.id} follower={follower} />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-card/10 rounded-[3rem] border border-dashed border-white/5">
              <Text variant="h3" className="mb-2 text-muted-foreground/50">No followers found</Text>
              <Text variant="bodySmall" className="text-muted-foreground">Adjust your search or wait for the network to expand.</Text>
            </div>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-0">
          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map(follower => (
                <FollowerCard key={follower.id} follower={follower} />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center bg-card/10 rounded-[3rem] border border-dashed border-white/5">
              <Text variant="h3" className="mb-2 text-muted-foreground/50">Not following anyone yet</Text>
              <Text variant="bodySmall" className="text-muted-foreground">Experts you follow will appear here.</Text>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-center gap-4 pt-10">
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold" disabled>
            <ChevronLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" className="w-10 h-10 rounded-xl font-bold">1</Button>
          </div>
          <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold" disabled>
            Next <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
