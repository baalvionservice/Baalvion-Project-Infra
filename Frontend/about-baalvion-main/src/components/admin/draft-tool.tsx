"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { draftContent } from "@/ai/flows/draft-content-flow";
import { useToast } from "@/hooks/use-toast";

export function DraftTool({ onDraftComplete }: { onDraftComplete?: (draft: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState("project description");
  const [keywords, setKeywords] = useState("");
  const [outline, setOutline] = useState("");
  const [result, setResult] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const output = await draftContent({
        contentType,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k !== ""),
        outline
      });
      setResult(output.draft);
      toast({ title: "Draft Generated", description: "AI has successfully created a content draft." });
    } catch (err) {
      toast({ title: "Generation Failed", description: "AI service encountered an error.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copied", description: "Draft copied to clipboard." });
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <CardTitle className="text-white">AI Content Drafter</CardTitle>
        </div>
        <CardDescription>Generate high-quality corporate drafts for Baalvion Nexus.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Content Type</label>
            <Input 
              value={contentType} 
              onChange={(e) => setContentType(e.target.value)} 
              placeholder="e.g. page section, project description" 
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Keywords (comma separated)</label>
            <Input 
              value={keywords} 
              onChange={(e) => setKeywords(e.target.value)} 
              placeholder="e.g. global trade, AI, compliance" 
              className="bg-white/5 border-white/10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Outline / Key Points</label>
          <Textarea 
            value={outline} 
            onChange={(e) => setOutline(e.target.value)} 
            placeholder="What should be included?" 
            className="bg-white/5 border-white/10"
          />
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Draft
        </Button>

        {result && (
          <div className="mt-6 p-4 rounded-xl bg-background border border-accent/20 space-y-3 relative group">
            <button 
              onClick={copyToClipboard}
              className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="w-4 h-4 text-accent" />
            </button>
            <p className="text-xs font-semibold text-accent uppercase tracking-wider">Generated Draft:</p>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
