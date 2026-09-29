"use client";

import React, { useState, useEffect } from 'react';
import { Recommendation } from '@/types/recommendation';
import { generateRecommendations } from '@/services/recommendations/recommendationService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  Target, 
  AlertCircle, 
  ChevronRight, 
  Loader2, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface RecommendationFeedProps {
  userId: string;
}

/**
 * @fileOverview RecommendationFeed
 * High-fidelity intelligence feed for the member dashboard.
 * Corrected for high visibility against light Bank-Grade UI backgrounds.
 */
export default function RecommendationFeed({ userId }: RecommendationFeedProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const data = await generateRecommendations(userId);
        const sorted = [...data].sort((a, b) => {
          const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return (priorityMap[b.priority] ?? 0) - (priorityMap[a.priority] ?? 0);
        });
        setRecommendations(sorted);
      } catch (err) {
        console.error("Recommendation sync failure:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchRecs();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 animate-pulse">Syncing Intelligence Feed...</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto opacity-50" />
        <div>
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Intelligence Ledger Clear</h4>
          <p className="text-xs text-slate-500 italic">You are all set! No pending strategic actions detected.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-blue-600" /> Recommended Actions
        </h3>
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Proactive Guidance</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.id} rec={rec} />
        ))}
      </div>
    </section>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const getIcon = () => {
    switch (rec.type) {
      case 'action': return <Target className="w-5 h-5 text-blue-600" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'suggestion': return <Zap className="w-5 h-5 text-amber-600" />;
      default: return <Sparkles className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBorder = () => {
    if (rec.priority === 'high') return 'border-blue-200 bg-blue-50/30';
    return 'border-slate-100 bg-white';
  };

  return (
    <Card className={`rounded-xl overflow-hidden group hover:border-blue-400 transition-all duration-500 shadow-sm interactive-lift ${getBorder()}`}>
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 group-hover:bg-blue-600 group-hover:text-white transition-all`}>
            {getIcon()}
          </div>
          {rec.priority === 'high' && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-blue-600 px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50">
              High Priority
            </span>
          )}
        </div>

        <div className="space-y-2 mb-6 flex-1">
          <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
            {rec.title}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            {rec.description}
          </p>
        </div>

        <Button asChild variant="outline" className="w-full h-10 rounded-lg text-[10px] font-bold uppercase tracking-widest border-slate-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
          <Link href={rec.actionLink} className="flex items-center justify-center gap-2">
            Take Action <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
