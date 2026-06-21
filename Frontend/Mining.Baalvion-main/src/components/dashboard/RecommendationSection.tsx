
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Gem, Building2, ThumbsUp, ThumbsDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Recommendation {
  id: string;
  type: 'PRODUCT' | 'SUPPLIER' | 'RFQ';
  title: string;
  subtitle: string;
  reason: string;
  score: number;
}

export function RecommendationSection() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([
    { id: "1", type: 'PRODUCT', title: "Copper Concentrate", subtitle: "Grade: 30% Cu • Chile", reason: "Based on your recent interest in industrial minerals.", score: 94 },
    { id: "2", type: 'SUPPLIER', title: "Zambia Copper Ltd", subtitle: "Africa • Tier 3 Exporter", reason: "Matches your preferred trade region and high-purity requirements.", score: 88 },
    { id: "3", type: 'RFQ', title: "Iron Ore Supply Request", subtitle: "25,000 MT • Rotterdam", reason: "High technical match with your available inventory in Shanghai.", score: 92 },
  ]);

  const handleDismiss = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
          <h3 className="text-xl font-headline font-bold text-primary">Smart Suggestions</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Personalize AI
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {recommendations.map((rec) => (
          <Card key={rec.id} className="border-none shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDismiss(rec.id)} className="p-1 hover:bg-slate-100 rounded">
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="p-2.5 bg-primary/5 rounded-xl text-primary">
                  {rec.type === 'PRODUCT' ? <Gem className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  {rec.score}% Match
                </Badge>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{rec.title}</h4>
                <p className="text-xs text-slate-500 font-medium">{rec.subtitle}</p>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border-l-2 border-l-secondary leading-relaxed">
                {rec.reason}
              </p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  <button className="p-1.5 hover:bg-emerald-50 rounded text-slate-300 hover:text-emerald-600 transition-colors">
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1.5 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-600 transition-colors">
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-primary gap-1 group">
                  Explore <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
