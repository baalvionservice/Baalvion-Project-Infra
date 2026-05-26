
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Filter,
  ChevronDown,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Reply,
  Loader2,
  Trash2
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface CreatorReviewsProps {
  creatorId: string;
}

type SortOption = 'recent' | 'highest' | 'lowest';

export function CreatorReviews({ creatorId }: CreatorReviewsProps) {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Reviews
  const reviewsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'reviews'),
      where('creatorId', '==', creatorId)
    );
  }, [db, creatorId]);

  const { data: reviews, loading } = useCollection<Review>(reviewsQuery);

  // 2. Compute Stats
  const stats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
    const total = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return {
      avg: (total / reviews.length).toFixed(1),
      count: reviews.length
    };
  }, [reviews]);

  // 3. Sort Logic
  const sortedReviews = useMemo(() => {
    if (!reviews) return [];
    return [...reviews].sort((a, b) => {
      if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });
  }, [reviews, sortBy]);

  const handleResponse = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setIsSubmitting(true);

    try {
      const reviewRef = doc(db!, 'reviews', reviewId);
      await updateDoc(reviewRef, { response: responseText });
      setRespondingTo(null);
      setResponseText('');
    } catch (err: any) {
      errorEmitter.emitPermissionError(new FirestorePermissionError({
        path: `/reviews/${reviewId}`,
        operation: 'update',
        requestResourceData: { response: responseText }
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading feedback...</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      {/* Header & Avg Rating */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center min-w-[140px]">
            <span className="text-5xl font-black text-slate-900 tracking-tighter">{stats.avg}</span>
            <div className="flex gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={cn("h-4 w-4", Number(stats.avg) >= i ? "text-yellow-400 fill-yellow-400" : "text-slate-200 fill-slate-200")} />
              ))}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mt-3 tracking-widest">{stats.count} Verified Reviews</p>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" /> Brand Feedback
            </h3>
            <p className="text-slate-500 font-medium max-w-sm mt-1">
              Real testimonials from brands who have collaborated with this creator.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl font-bold bg-white border-slate-200 h-11 px-6">
                <Filter className="mr-2 h-4 w-4 text-slate-400" />
                {sortBy === 'recent' ? 'Most Recent' : sortBy === 'highest' ? 'Highest Rated' : 'Lowest Rated'}
                <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-2 w-48">
              <DropdownMenuItem onClick={() => setSortBy('recent')} className="rounded-lg font-bold">Most Recent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('highest')} className="rounded-lg font-bold">Highest Rated</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('lowest')} className="rounded-lg font-bold">Lowest Rated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {sortedReviews.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {sortedReviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                layout
              >
                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow group">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Review Main */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 rounded-xl border border-slate-50 shadow-sm">
                              <AvatarImage src={review.brandLogo} />
                              <AvatarFallback>{review.brandName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                                {review.brandName}
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 fill-blue-500/10" />
                              </h4>
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">
                                Campaign: {review.campaignTitle}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex gap-0.5 justify-end mb-1">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={cn("h-3.5 w-3.5", review.rating >= i ? "text-yellow-400 fill-yellow-400" : "text-slate-100 fill-slate-100")} />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {new Date(review.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        <p className="text-slate-600 font-medium leading-relaxed italic text-lg">
                          "{review.comment}"
                        </p>

                        {/* Response Section */}
                        {review.response ? (
                          <div className="mt-6 p-6 rounded-2xl bg-primary/5 border border-primary/10 relative">
                            <div className="absolute -top-3 left-6 bg-white border border-primary/10 px-3 py-0.5 rounded-full flex items-center gap-1.5">
                              <Reply className="h-3 w-3 text-primary" />
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Creator Response</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                              {review.response}
                            </p>
                          </div>
                        ) : (
                          currentUser?.id === creatorId && (
                            <div className="pt-2">
                              {respondingTo === review.id ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                  <Textarea
                                    placeholder="Write a professional response..."
                                    className="rounded-xl min-h-[80px] bg-slate-50 border-slate-200"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" className="rounded-lg font-bold" onClick={() => setRespondingTo(null)}>Cancel</Button>
                                    <Button
                                      size="sm"
                                      className="rounded-lg font-bold px-6"
                                      disabled={isSubmitting || !responseText.trim()}
                                      onClick={() => handleResponse(review.id)}
                                    >
                                      {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Reply className="h-3 w-3 mr-2" />}
                                      Post Response
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-[10px] font-black uppercase text-slate-400 hover:text-primary p-0 h-auto gap-1.5"
                                  onClick={() => setRespondingTo(review.id)}
                                >
                                  <Reply className="h-3.5 w-3.5" /> Respond to review
                                </Button>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6">
              <Star className="h-10 w-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No reviews yet</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto font-medium">
              Complete your first campaign to start receiving verified feedback from brands.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
