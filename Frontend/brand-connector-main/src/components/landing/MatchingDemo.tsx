'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Users, 
  TrendingUp, 
  MapPin, 
  Zap,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CREATOR_NICHES, COUNTRIES } from '@/constants';
import Image from 'next/image';

const MOCK_DEMO_CREATORS = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    handle: '@sarah_tech',
    niche: 'Tech & Gadgets',
    followers: 850000,
    er: 5.8,
    location: 'United States',
    image: 'https://picsum.photos/seed/sarah/400/400',
    matchScore: 98,
    bio: 'Unboxing the future of consumer electronics and AI.',
  },
  {
    id: '2',
    name: 'Marco Rossi',
    handle: '@marco_style',
    niche: 'Fashion & Style',
    followers: 120000,
    er: 8.2,
    location: 'United Kingdom',
    image: 'https://picsum.photos/seed/marco/400/400',
    matchScore: 94,
    bio: 'Sustainable high-street fashion and minimalist aesthetics.',
  },
  {
    id: '3',
    name: 'Priya Sharma',
    handle: '@priya_explores',
    niche: 'Travel & Adventure',
    followers: 450000,
    er: 4.1,
    location: 'India',
    image: 'https://picsum.photos/seed/priya/400/400',
    matchScore: 91,
    bio: 'Finding hidden gems across Asia and the Middle East.',
  },
  {
    id: '4',
    name: 'James Wilson',
    handle: '@j_fit_performance',
    niche: 'Fitness & Wellness',
    followers: 250000,
    er: 6.5,
    location: 'Canada',
    image: 'https://picsum.photos/seed/james/400/400',
    matchScore: 89,
    bio: 'Elite performance training and holistic nutrition.',
  },
  {
    id: '5',
    name: 'Elena Vance',
    handle: '@elena_gadgets',
    niche: 'Tech & Gadgets',
    followers: 320000,
    er: 7.4,
    location: 'Germany',
    image: 'https://picsum.photos/seed/elena/400/400',
    matchScore: 96,
    bio: 'Testing the latest smart home tech and daily drivers.',
  },
  {
    id: '6',
    name: 'Chloe Dubois',
    handle: '@chloe_beauty',
    niche: 'Beauty & Personal Care',
    followers: 680000,
    er: 3.9,
    location: 'France',
    image: 'https://picsum.photos/seed/chloe/400/400',
    matchScore: 92,
    bio: 'Luxury skincare routines and cruelty-free makeup.',
  }
];

export function MatchingDemo() {
  const [niche, setNiche] = useState<string>('all');
  const [location, setLocation] = useState<string>('all');
  const [minFollowers, setMinFollowers] = useState<number[]>([0]);
  const [minER, setMinER] = useState<number[]>([0]);

  const filteredCreators = useMemo(() => {
    return MOCK_DEMO_CREATORS.filter(c => {
      const matchNiche = niche === 'all' || c.niche === niche;
      const matchLoc = location === 'all' || c.location === location;
      const matchFollowers = c.followers >= minFollowers[0] * 1000;
      const matchER = c.er >= minER[0];
      return matchNiche && matchLoc && matchFollowers && matchER;
    }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [niche, location, minFollowers, minER]);

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1">
            Live Demo
          </Badge>
          <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl mb-4">
            Experience Our AI Matching Engine
          </h2>
          <p className="text-muted-foreground text-lg max-w-[700px]">
            Adjust the parameters to see how Baalvion identifies the perfect creator profile for your campaign objectives.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Filter Panel */}
          <Card className="lg:col-span-4 border-slate-200 shadow-xl shadow-slate-200/50">
            <CardContent className="p-6 space-y-8">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="font-headline font-bold text-lg">Campaign Filters</h3>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700">Primary Niche</label>
                <Select value={niche} onValueChange={setNiche}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select Niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Niches</SelectItem>
                    {CREATOR_NICHES.slice(0, 10).map(n => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Min. Followers</label>
                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                    {minFollowers[0]}k+
                  </span>
                </div>
                <Slider 
                  value={minFollowers} 
                  onValueChange={setMinFollowers} 
                  max={1000} 
                  step={50}
                  className="py-4"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700">Min. Engagement Rate</label>
                  <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                    {minER[0]}%+
                  </span>
                </div>
                <Slider 
                  value={minER} 
                  onValueChange={setMinER} 
                  max={10} 
                  step={0.5}
                  className="py-4"
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700">Target Location</label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global</SelectItem>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full h-12 rounded-xl group" variant="primary">
                Reset Parameters
                <Zap className="ml-2 h-4 w-4 fill-current group-hover:scale-110 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Results Display */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground font-bold">{filteredCreators.length}</span> top matches for your criteria
              </p>
              <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                <CheckCircle2 className="h-3.5 w-3.5" />
                AI Verified Data
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredCreators.length > 0 ? (
                  filteredCreators.map((creator, index) => (
                    <motion.div
                      key={creator.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      layout
                    >
                      <Card className="overflow-hidden border-slate-200 hover:border-primary/30 transition-all group">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="relative w-full md:w-32 h-48 md:h-auto overflow-hidden">
                              <Image 
                                src={creator.image} 
                                alt={creator.name} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="flex-1 p-6">
                              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                <div>
                                  <h4 className="text-xl font-headline font-bold">{creator.name}</h4>
                                  <p className="text-sm text-primary font-medium">{creator.handle}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Match Score</span>
                                    <div className="text-2xl font-black text-primary">{creator.matchScore}%</div>
                                  </div>
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${creator.matchScore}%` }}
                                      transition={{ duration: 1, delay: 0.2 }}
                                      className="h-full bg-primary" 
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                {creator.bio}
                              </p>

                              <div className="flex flex-wrap gap-4 mt-auto">
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <Users className="h-4 w-4 text-slate-400" />
                                  <span>{(creator.followers / 1000).toFixed(0)}k</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <TrendingUp className="h-4 w-4 text-slate-400" />
                                  <span>{creator.er}% ER</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                  <MapPin className="h-4 w-4 text-slate-400" />
                                  <span>{creator.location}</span>
                                </div>
                                <Badge variant="secondary" className="ml-auto bg-slate-100 text-slate-600 border-none">
                                  {creator.niche}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200"
                  >
                    <Search className="h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">No matches found</h3>
                    <p className="text-sm text-slate-400">Try loosening your filter criteria to find more creators.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}