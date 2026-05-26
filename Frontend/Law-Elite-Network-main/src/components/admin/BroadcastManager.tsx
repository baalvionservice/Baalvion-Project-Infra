
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Radio, 
  Send, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  Loader2,
  Globe,
  Gavel
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview BroadcastManager
 * Executive module for transmitting high-priority signals across the network.
 */
export default function BroadcastManager() {
  const [target, setTarget] = useState("all");
  const [priority, setPriority] = useState("medium");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const { toast } = useToast();

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTransmitting(true);
    // Simulate global propagation latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Signal Propagated",
      description: `Broadcast successfully transmitted to the ${target} population.`,
    });
    setIsTransmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-700">
      <header>
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3 font-headline italic">
          <Radio className="w-6 h-6 text-red-600 animate-pulse" /> Global Broadcast Protocol
        </h3>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Direct signaling to verified network members and practitioners.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-900">Signal Parameters</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleBroadcast} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Target Segment</Label>
                    <Select value={target} onValueChange={setTarget}>
                      <SelectTrigger className="h-11 border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Total Population</SelectItem>
                        <SelectItem value="lawyers">Verified Practitioners</SelectItem>
                        <SelectItem value="clients">Premier Clients</SelectItem>
                        <SelectItem value="elite">Elite Tier Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Signal Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-11 border-slate-200 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Standard Alert</SelectItem>
                        <SelectItem value="medium">Elevated Notification</SelectItem>
                        <SelectItem value="high">Critical Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Signal Heading</Label>
                  <Input placeholder="e.g. System Maintenance Window Scheduled" className="h-11 border-slate-200 bg-white" required />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Protocol Payload</Label>
                  <Textarea placeholder="Enter the full broadcast message content..." className="min-h-[120px] border-slate-200 bg-white italic" required />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    disabled={isTransmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase text-[10px] tracking-[0.2em] h-12 rounded-xl shadow-lg shadow-red-900/20"
                  >
                    {isTransmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Initialize Global Transmission
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card className="bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-red-600/20 transition-all duration-700" />
            <CardContent className="p-6 space-y-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Authority Alert</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "Global broadcasts bypass individual notification preferences to ensure zero-latency reception of critical system updates."
              </p>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase text-red-400">
                  <span>Last Broadcast:</span>
                  <span>14H AGO</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Network Reach</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase">Jurisdictions</span>
                </div>
                <span className="text-xs font-bold">120+</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Gavel className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase">Lawyers</span>
                </div>
                <span className="text-xs font-bold">5,420</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase">Clients</span>
                </div>
                <span className="text-xs font-bold">12,890</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
