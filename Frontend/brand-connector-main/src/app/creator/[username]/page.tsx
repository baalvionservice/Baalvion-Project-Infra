
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Instagram,
  Youtube,
  Music2,
  CheckCircle2,
  MapPin,
  Star,
  Zap,
  Users,
  TrendingUp,
  MessageSquare,
  Share2,
  ExternalLink,
  IndianRupee,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatorReviews } from '@/components/profile/CreatorReviews';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { CreatorProfile } from '@/types';
import { InviteCreatorDialog } from '@/components/dashboard/brand/InviteCreatorDialog';

export default function CreatorPublicProfile() {
  const params = useParams();
  const username = params.username as string;
  const db = useFirestore();

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Fetch creator profile by username
  const creatorQuery = React.useMemo(() => {
    return query(
      collection(db!, 'creators'),
      where('username', '==', username),
      limit(1)
    );
  }, [db!, username]);

  const { data: creatorResults, loading } = useCollection<CreatorProfile>(creatorQuery);
  const data = creatorResults?.[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-8">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Creator Not Found</h1>
        <p className="text-slate-500 mb-8">The creator profile you are looking for does not exist or has been moved.</p>
        <Link href="/">
          <Button className="rounded-xl font-bold">Return Home</Button>
        </Link>
      </div>
    );
  }

  // Base rates formatting
  const formattedRates = Object.entries(data.baseRates || {}).map(([key, val]) => ({
    deliverable: key.charAt(0).toUpperCase() + key.slice(1) + ' Content',
    price: `₹${Number(val).toLocaleString()}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero / Header Section */}
      <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
        <Image
          src={data.photoURL} // Using profile photo as cover placeholder if cover is missing
          alt="Cover"
          fill
          className="object-cover blur-3xl opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="container relative h-full flex items-end pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full text-center md:text-left">
            <div className="relative group">
              <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white shadow-2xl ring-4 ring-primary/20">
                <AvatarImage src={data.photoURL} />
                <AvatarFallback className="text-4xl font-black">{data.username[0]}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-primary fill-primary/10" />
              </div>
            </div>

            <div className="flex-1 space-y-2 mb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                  {data.username}
                </h1>
                <Badge className="bg-primary/20 backdrop-blur-md border-primary/30 text-white w-fit self-center">
                  @{data.username}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90 font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> {data.location || 'Global'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  {data.rating || '5.0'} Verified
                </span>
              </div>
            </div>

            <div className="flex gap-3 mb-2">
              <Button size="lg" className="rounded-xl font-bold shadow-xl shadow-primary/20 px-8" onClick={() => setIsInviteOpen(true)}>
                Work with {data.username} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl bg-white/10 backdrop-blur-md text-white border-white/30 hover:bg-white hover:text-primary transition-all">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Details & Portfolio */}
        <div className="lg:col-span-8 space-y-12">

          {/* About Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Professional Bio
            </h3>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              {data.bio}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.niches.map(niche => (
                <Badge key={niche} variant="secondary" className="rounded-lg px-4 py-1.5 bg-white border-slate-200 text-slate-600 font-bold hover:border-primary transition-colors">
                  {niche}
                </Badge>
              ))}
            </div>
          </section>

          {/* Social Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'instagram', icon: Instagram, color: 'text-pink-600', name: 'Instagram' },
              { id: 'youtube', icon: Youtube, color: 'text-red-600', name: 'YouTube' },
              { id: 'tiktok', icon: Music2, color: 'text-slate-900', name: 'TikTok' },
            ].map((plat) => {
              const stats = data.socialStats?.[plat.id];
              if (!stats || !stats.connected) return null;
              return (
                <Card key={plat.id} className="border-none shadow-sm shadow-slate-200/50 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-slate-50 p-2.5 rounded-xl">
                        <plat.icon className={`h-6 w-6 ${plat.color}`} />
                      </div>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black">
                        VERIFIED
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{plat.name}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">Syncing...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Reviews Section */}
          <CreatorReviews creatorId={data.userId} />

          {/* Portfolio Grid */}
          {data.portfolioSamples && data.portfolioSamples.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Recent Collaborations
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.portfolioSamples.map((url, idx) => (
                  <div key={idx} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg cursor-pointer">
                    <Image src={url} alt="Portfolio" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Rate Card & CTA */}
        <div className="lg:col-span-4 space-y-8">

          {/* AI Match Score (For Brand context) */}
          <Card className="border-none shadow-xl shadow-primary/10 rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-indigo-700 text-white">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Zap className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                </div>
                <Badge className="bg-white/20 text-white border-none backdrop-blur-md font-bold">SMART MATCH</Badge>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-xs font-black uppercase tracking-widest text-white/60">Campaign Fit Score</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-5xl font-black">98%</h4>
                  <span className="text-sm font-bold text-white/80">Excellent</span>
                </div>
                <Progress value={98} className="h-2 bg-white/20" />
              </div>
              <p className="text-sm text-white/80 font-medium leading-relaxed">
                Matches your audience demographics perfectly. High engagement rate suggested for product launches.
              </p>
            </CardContent>
          </Card>

          {/* Rate Card */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="border-b bg-slate-50/50 py-6 px-8">
              <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-primary" /> Rate Card
              </CardTitle>
              <CardDescription className="font-medium">Estimated base rates for 2024</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {formattedRates.length > 0 ? formattedRates.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-bold text-slate-700">{item.deliverable}</span>
                    <span className="text-md font-black text-primary">{item.price}</span>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">
                    Request rates from creator
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="p-8 pt-0 flex flex-col gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 items-start border border-slate-100 mt-6">
                <Clock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500 font-medium">Rates are negotiable based on campaign volume and usage rights.</p>
              </div>
              <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20" onClick={() => setIsInviteOpen(true)}>
                <Send className="mr-2 h-5 w-5" /> Send Campaign Invite
              </Button>
            </CardFooter>
          </Card>

          {/* Trust Seal */}
          <div className="p-6 rounded-3xl bg-slate-100/50 border border-dashed border-slate-300 flex flex-col items-center text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 uppercase">Secure Collaboration</p>
              <p className="text-[10px] text-slate-500 font-medium mt-1">
                Payments held in escrow. Content verified by Baalvion AI before payout.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Invite Modal */}
      <InviteCreatorDialog
        creator={{
          id: data.userId,
          name: data.username,
          handle: data.username,
          image: data.photoURL
        }}
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
      />
    </div>
  );
}
