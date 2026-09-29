"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer, Clock, CheckCircle2, ArrowRight, Trash2, Loader2 } from "lucide-react";
import { Lead } from "@/services/lead-service";
import { useState } from "react";
import { BlueprintDialog } from "./BlueprintDialog";
import { LeadProfileDialog } from "./LeadProfileDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";

interface LeadTableProps {
  leads: Lead[];
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onDelete: (id: string) => void;
}

export function LeadTable({ leads, onUpdate, onDelete }: LeadTableProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const getStage = (volume: string) => {
    const map: Record<string, string> = {
      "0-50": "Beginner",
      "50-200": "Scaling",
      "200-500": "Expansion",
      "500+": "Enterprise"
    };
    return map[volume] || "Unknown";
  };

  const handleGeneratePDF = (id: string) => {
    setIsGenerating(id);
    setTimeout(() => {
      onUpdate(id, { pdfGenerated: true, emailSent: true });
      setIsGenerating(null);
    }, 1000);
  };

  return (
    <ScrollArea className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold">Lead Details</TableHead>
            <TableHead className="font-bold">Company</TableHead>
            <TableHead className="font-bold">Industrial Score</TableHead>
            <TableHead className="font-bold">Blueprint</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="text-right font-bold">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">{lead.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{lead.date}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-700">{lead.company}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <StatusBadge status={`Score: ${lead.score}`} type="KYC" className={lead.score > 85 ? "bg-emerald-100" : "bg-blue-100"} />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{getStage(lead.volume)}</span>
                </div>
              </TableCell>
              <TableCell>
                {lead.pdfGenerated ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-primary font-bold bg-primary/5">
                        <FileText className="h-3.5 w-3.5" /> View
                      </Button>
                    </DialogTrigger>
                    <BlueprintDialog lead={lead} />
                  </Dialog>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-2 text-slate-300"
                    disabled={isGenerating === lead.id}
                    onClick={() => handleGeneratePDF(lead.id)}
                  >
                    {isGenerating === lead.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />} Pending
                  </Button>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {lead.emailSent ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Sent
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-300 text-[10px] font-bold uppercase">
                      <Clock className="h-3.5 w-3.5" /> Queued
                    </span>
                  )}
                  <StatusBadge status={lead.status} type="KYC" className={lead.status === "Booked" ? "bg-emerald-100" : "bg-slate-100 text-slate-400"} />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="font-bold text-primary gap-1">
                        Profile <ArrowRight className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <LeadProfileDialog lead={lead} onUpdate={(updates) => onUpdate(lead.id, updates)} />
                  </Dialog>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500" onClick={() => onDelete(lead.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
