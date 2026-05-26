'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lightbulb,
  ChevronDown,
  Copy,
  Check,
  Bookmark,
  Loader2,
  Zap,
  Video,
  Layout,
  Smartphone,
  Wand2,
  RefreshCcw,
  MessageSquare,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { generateContentIdeas } from '@/ai/flows/generate-content-ideas-flow';
import { useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface ContentIdeasProps {
  campaignTitle: string;
  campaignBrief: string;
  creatorNiche: string;
  className?: string;
}

export function ContentIdeas({ campaignTitle, campaignBrief, creatorNiche, className }: ContentIdeasProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const db = useFirestore();

  const [ideas, setIdeas] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateContentIdeas({
        campaignTitle,
        campaignBrief,
        creatorNiche
      });
      setIdeas(result.ideas);
      toast({ title: "Brainstorming Complete", description: "5 new AI-generated concepts are ready." });
    } catch (err) {
      toast({ variant: "destructive", title: "Brainstorming Failed", description: "Could not connect to AI services." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToNotes = async (idea: any, index: number) => {
    if (!currentUser?.id) return;

    try {
      await addDoc(collection(db!, 'creator_notes'), {
        userId: currentUser.id,
        campaignTitle,
        title: idea.title,
        content: `Format: ${idea.format}\nHook: ${idea.hook}\nMessage: ${idea.keyMessage}\nTip: ${idea.engagementTip}`,
        type: 'AI_IDEA',
        createdAt: new Date().toISOString()
      });

      setSavedIds(prev => [...prev, `${index}`]);
      toast({ title: "Saved to Notes", description: "This idea is now in your production backlog." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not sync to cloud notes." });
    }
  };

  const copyToClipboard = (idea: any, index: number) => {
    const text = `Title: ${idea.title}\nFormat: ${idea.format}\nHook: ${idea.hook}\nMessage: ${idea.keyMessage}\nTip: ${idea.engagementTip}`;
    navigator.clipboard.writeText(text);
    setCopiedId(`${index}`);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const getFormatIcon = (format: string) => {
    if (format.toLowerCase().includes('reel') || format.toLowerCase().includes('video')) return <Video className="h-4 w-4" />;
    if (format.toLowerCase().includes('story')) return <Smartphone className="h-4 w-4" />;
    return <Layout className="h-4 w-4" />;
  };

  return (
    <Card className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-primary" />
            AI Content Ideas
          </CardTitle>
          <CardDescription className="font-medium">Strategic concepts for your campaign deliverables.</CardDescription>
        </div>
        <Badge variant="outline" className="bg-white border-slate-200 text-primary font-black text-[10px] uppercase tracking-widest px-3 py-1">
          AI Suggestions
        </Badge>
      </CardHeader>

      <CardContent className="p-8">
        <AnimatePresence mode="wait">
          {ideas.length === 0 && !isGenerating ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="h-20 w-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center">
                <Wand2 className="h-10 w-10 text-primary/20" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">Need a Creative Spark?</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Our AI will analyze the brand brief and your niche expertise to generate 5 high-impact content concepts.
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                className="rounded-xl font-black h-12 px-8 shadow-lg shadow-primary/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Creative Ideas
              </Button>
            </motion.div>
          ) : isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Brainstorming</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Analyzing niche performance data...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Accordion type="single" collapsible className="w-full space-y-4">
                {ideas.map((idea, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`item-${idx}`}
                    className="border-2 border-slate-50 rounded-2xl px-6 bg-white hover:border-primary/10 transition-all shadow-sm overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-6 group">
                      <div className="flex items-center gap-4 text-left">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors shrink-0">
                          {getFormatIcon(idea.format)}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">{idea.format}</p>
                          <h4 className="font-bold text-slate-900 text-lg leading-tight">{idea.title}</h4>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 pt-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">The Hook</label>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                              "{idea.hook}"
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Key Message</label>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">
                              {idea.keyMessage}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-600">
                              <Zap className="h-3.5 w-3.5 fill-emerald-600/20" />
                              <span className="text-[10px] font-black uppercase tracking-widest">Growth Tip</span>
                            </div>
                            <p className="text-xs font-bold text-emerald-800 leading-relaxed">
                              {idea.engagementTip}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl font-bold h-10 gap-2 border-slate-200"
                              onClick={() => copyToClipboard(idea, idx)}
                            >
                              {copiedId === `${idx}` ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                              Copy Idea
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1 rounded-xl font-bold h-10 gap-2"
                              disabled={savedIds.includes(`${idx}`)}
                              onClick={() => handleSaveToNotes(idea, idx)}
                            >
                              {savedIds.includes(`${idx}`) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Bookmark className="h-4 w-4" />}
                              {savedIds.includes(`${idx}`) ? 'Saved' : 'Save to Notes'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="flex justify-center pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-primary"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                  Regenerate New Concepts
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="p-8 bg-slate-50/50 border-t flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
            Use these ideas to build a more compelling pitch.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary font-black text-[10px] uppercase group h-8">
          View Notes <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
}
