"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DialogFooter } from "@/components/ui/dialog";
import { Text } from "@/design-system/typography/text";
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  Zap,
  Tag as TagIcon,
  Sparkles,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface NewDiscussionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * High-fidelity form for initiating new community discussions.
 */
export function NewDiscussionForm({
  onSuccess,
  onCancel,
}: NewDiscussionFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate data handshake
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSuccess(true);

    toast({
      title: "Discussion Indexed",
      description:
        "Your research node has been broadcast to the community network.",
    });

    if (onSuccess) setTimeout(onSuccess, 2000);
  };

  if (success) {
    return (
      <Card className="glass-card border-emerald-500/20 bg-emerald-500/5 p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <Text variant="h3" className="text-2xl font-bold mb-2">
          Insight Successfully Deployed
        </Text>
        <Text
          variant="bodySmall"
          className="text-muted-foreground leading-relaxed max-w-sm mx-auto"
        >
          Your discussion node is now live. Monitor your activity feed for
          engagement signals and expert responses.
        </Text>
        <Button
          variant="outline"
          className="mt-8 rounded-xl border-emerald-500/20 text-emerald-500"
          onClick={() => setSuccess(false)}
        >
          Post Another Insight
        </Button>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-none shadow-2xl overflow-hidden group">
      <CardHeader className="bg-card/30 border-b border-white/5 p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <Text
              variant="label"
              className="text-[10px] font-bold text-primary uppercase tracking-widest"
            >
              Discussion Architect
            </Text>
            <CardTitle className="text-xl font-bold">
              Start New Intelligence Thread
            </CardTitle>
          </div>
        </div>
        <CardDescription>
          Contribute to the global knowledge index by sharing your analysis or
          identifying market anomalies.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Discussion Headline
              </Label>
              <Input
                placeholder="e.g. Analyzing the divergence in Q2 liquidity nodes..."
                className="h-12 bg-background/50 border-white/5 rounded-xl font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Taxonomy Hub
                </Label>
                <Select defaultValue="Macro">
                  <SelectTrigger className="h-11 bg-background/50 border-white/5 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stocks">Stocks</SelectItem>
                    <SelectItem value="Cryptocurrency">
                      Cryptocurrency
                    </SelectItem>
                    <SelectItem value="Macro">Macroeconomics</SelectItem>
                    <SelectItem value="Economy">Economy</SelectItem>
                    <SelectItem value="Trading">Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Asset Node (Optional)
                </Label>
                <div className="relative group">
                  <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="e.g. BTC, NVDA"
                    className="pl-10 h-11 bg-background/50 border-white/5 rounded-xl uppercase font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Research Payload
              </Label>
              <Textarea
                placeholder="Provide your analysis, technical setup, or fundamental thesis..."
                className="bg-background/50 border-white/5 min-h-[180px] resize-none leading-relaxed rounded-2xl p-6 text-base italic"
                required
              />
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 relative overflow-hidden">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <Text
              variant="caption"
              className="text-muted-foreground leading-relaxed italic"
            >
              "Every discussion node is audited for factual compliance. Experts
              with high reputation scores receive a **2.4x discovery reach
              multiplier**."
            </Text>
          </div>

          <DialogFooter className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-8 rounded-xl font-bold"
              onClick={onCancel}
            >
              Discard Draft
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all scale-[1.02] active:scale-100"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Dispatch Intelligence Node
            </Button>
          </DialogFooter>
        </form>
      </CardContent>
    </Card>
  );
}
