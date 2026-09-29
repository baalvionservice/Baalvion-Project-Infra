'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  RefreshCcw, 
  Copy, 
  Check, 
  Loader2, 
  Send, 
  Zap, 
  FileText,
  AlertCircle,
  Wand2,
  Trash2,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generatePitch } from '@/ai/flows/generate-pitch-flow';
import { cn } from '@/lib/utils';

interface PitchAssistantProps {
  niche: string;
  campaignTitle: string;
  campaignBrief: string;
  onApply?: (pitch: string) => void;
  className?: string;
}

export function PitchAssistant({ 
  niche, 
  campaignTitle, 
  campaignBrief, 
  onApply,
  className 
}: PitchAssistantProps) {
  const { toast } = useToast();
  const [pitch, setPitch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = pitch.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, [pitch]);

  const handleGenerate = async () => {
    if (!niche || !campaignTitle) {
      return toast({
        variant: 'destructive',
        title: 'Context Required',
        description: 'Please ensure campaign details are loaded to generate a pitch.',
      });
    }

    setIsGenerating(true);
    try {
      const result = await generatePitch({
        creatorNiche: niche,
        campaignTitle,
        campaignBrief,
      });
      setPitch(result.pitch);
      toast({
        title: 'Pitch Draft Ready',
        description: 'Review and customize your personalized application.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'The AI assistant is temporarily unavailable. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pitch);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <Card className={cn("border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white", className)}>
      <CardHeader className="p-8 border-b bg-slate-50/50 flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-primary" />
            AI Writing Assistant
          </CardTitle>
          <CardDescription className="font-medium">Generate a professional pitch for this campaign.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-400 font-bold text-[10px] uppercase h-7 px-3 flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
            Powered by Claude
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <AnimatePresence mode="wait">
          {!pitch && !isGenerating ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="h-20 w-20 rounded-[2.5rem] bg-primary/5 flex items-center justify-center">
                <Zap className="h-10 w-10 text-primary/20" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900">Unlock a Higher Acceptance Rate</h4>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Our AI analyzes the brand brief and your niche to craft a compelling proposal that stands out.
                </p>
              </div>
              <Button 
                onClick={handleGenerate} 
                className="rounded-xl font-black h-12 px-8 shadow-lg shadow-primary/20"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Pitch Draft
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
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Analyzing Brief</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Crafting your unique value proposition...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Application Draft</label>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    {wordCount} Words
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-primary p-0 px-2"
                    onClick={handleGenerate}
                  >
                    <RefreshCcw className="h-3 w-3 mr-1" /> Regenerate
                  </Button>
                </div>
              </div>
              
              <div className="relative group">
                <Textarea 
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder="Your generated pitch will appear here..."
                  className="min-h-[250px] rounded-[2rem] p-8 bg-slate-50 border-none focus-visible:ring-primary text-md leading-relaxed text-slate-700 font-medium scrollbar-hide shadow-inner"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl shadow-lg" onClick={copyToClipboard}>
                    {isCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl shadow-lg text-red-400" onClick={() => setPitch('')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary font-medium leading-relaxed">
                  Tip: Customize the generated draft to include specific links to your previous work that match the brand&apos;s aesthetic.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      {pitch && (
        <CardFooter className="p-8 pt-0 border-t bg-slate-50/30 py-6">
          <Button 
            onClick={() => onApply?.(pitch)} 
            className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 bg-primary"
          >
            <Send className="mr-2 h-5 w-5" />
            Apply with this Pitch
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
