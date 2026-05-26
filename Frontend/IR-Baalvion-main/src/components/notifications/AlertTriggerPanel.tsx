
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Megaphone, Send, ShieldCheck, Database } from "lucide-react";
import { auditService } from "@/core/services/audit.service";
import { UserRole } from "@/core/content/schemas";

export function AlertTriggerPanel({ role }: { role: UserRole }) {
  const [eventType, setEventType] = useState('nav');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const { toast } = useToast();

  const handleBroadcast = async () => {
    setIsBroadcasting(true);
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const events: Record<string, any> = {
      nav: { title: "NAV Update", msg: "Quarterly revaluation published." },
      call: { title: "Capital Call", msg: "Drawdown notice issued for Series B." },
      dist: { title: "Distribution", msg: "Dividend payout authorized." }
    };

    const selected = events[eventType];

    await auditService.log({
      userRole: role,
      module: 'Notifications',
      action: 'send',
      entityId: `SIM-${Date.now()}`,
      newState: { type: selected.title }
    });

    toast({
      title: "Broadcast Successful",
      description: `Target segments notified: ${selected.title}`,
    });

    setIsBroadcasting(false);
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Strategic Broadcast Simulation
        </CardTitle>
        <CardDescription>Initiate platform-wide investor alerts for operational milestones.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={eventType} onValueChange={setEventType} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-primary/5 transition-colors cursor-pointer">
            <RadioGroupItem value="nav" id="nav" />
            <Label htmlFor="nav" className="flex flex-col cursor-pointer">
              <span className="font-bold text-xs">NAV Revaluation</span>
              <span className="text-[10px] text-muted-foreground italic">Target: All LPs</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-primary/5 transition-colors cursor-pointer">
            <RadioGroupItem value="call" id="call" />
            <Label htmlFor="call" className="flex flex-col cursor-pointer">
              <span className="font-bold text-xs">Capital Call</span>
              <span className="text-[10px] text-muted-foreground italic">Target: Institutional</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-primary/5 transition-colors cursor-pointer">
            <RadioGroupItem value="dist" id="dist" />
            <Label htmlFor="dist" className="flex flex-col cursor-pointer">
              <span className="font-bold text-xs">Distribution</span>
              <span className="text-[10px] text-muted-foreground italic">Target: P1/P2 only</span>
            </Label>
          </div>
        </RadioGroup>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex gap-3 items-start">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed italic">
            "Broadcasting operational updates triggers automated email simulations and UI notifications across all authorized dashboard tranches."
          </p>
        </div>

        <Button 
          className="w-full h-11 font-bold uppercase tracking-widest shadow-lg shadow-primary/20" 
          disabled={isBroadcasting}
          onClick={handleBroadcast}
        >
          {isBroadcasting ? "Syncing Registry..." : "Dispatch Strategic Alert"} <Send className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
