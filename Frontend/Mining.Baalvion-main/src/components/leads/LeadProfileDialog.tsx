
"use client"

import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, ShieldCheck, Mail, Phone, TrendingUp, Gavel, Clock } from "lucide-react";
import { Lead } from "@/hooks/use-leads";

interface LeadProfileDialogProps {
  lead: Lead;
  onUpdate: (updates: Partial<Lead>) => void;
}

export function LeadProfileDialog({ lead, onUpdate }: LeadProfileDialogProps) {
  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          Lead Profile: {lead.company}
        </DialogTitle>
        <DialogDescription>Full business profile captured via the partnership survey blueprint.</DialogDescription>
      </DialogHeader>
      <div className="grid md:grid-cols-2 gap-8 py-6">
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="font-bold">{lead.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-slate-600">{lead.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-slate-600">{lead.phone}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Notes</Label>
            <Textarea 
              className="min-h-[100px] text-xs" 
              placeholder="Internal readiness notes..."
              defaultValue={lead.notes}
              onBlur={(e) => onUpdate({ notes: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Industrial Score</p>
                  <h3 className="text-3xl font-bold">{lead.score} / 100</h3>
                </div>
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div className="p-3 bg-white/10 rounded-xl border border-white/10">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mb-1">Trade Volume</p>
                <p className="text-sm font-medium">{lead.volume} MT / Month</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="text-[10px] font-bold uppercase h-10"
                onClick={() => onUpdate({ status: "Booked" })}
                disabled={lead.status === "Booked"}
              >
                <Gavel className="h-3 w-3 mr-2" /> Mark Booked
              </Button>
              <Button variant="outline" className="text-[10px] font-bold uppercase h-10">
                <Mail className="h-3 w-3 mr-2" /> Resend PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter className="border-t pt-6">
        <div className="flex-1 flex items-center gap-2 text-[10px] text-slate-400 italic">
          <Clock className="h-3 w-3" /> System Verified Interaction
        </div>
        <Button className="bg-primary font-bold px-8">Sync Profile</Button>
      </DialogFooter>
    </DialogContent>
  );
}
