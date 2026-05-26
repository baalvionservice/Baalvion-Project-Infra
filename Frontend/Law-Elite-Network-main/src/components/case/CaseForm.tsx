"use client";

import React, { useState } from "react";
import { createCase } from "@/services/caseService";
import DocumentUpload from "./DocumentUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Gavel, Save, Loader2, ShieldCheck } from "lucide-react";

interface CaseFormProps {
  user: any;
  lawyer: any;
  onSuccess: () => void;
}

/**
 * @fileOverview CaseForm
 * Professional brief initialization component for elite clients.
 */
export default function CaseForm({ user, lawyer, onSuccess }: CaseFormProps) {
  const [title, setTitle] = useState("");
  const [docs, setDocs] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await createCase({
        id: `case_${Date.now()}`,
        userId: user.id,
        lawyerId: lawyer.id,
        title,
        status: "open",
        documents: docs,
        createdAt: Date.now(),
      });

      toast({
        title: "Legal Brief Initialized",
        description: "The case dossier has been established and shared with counsel.",
      });
      
      setTitle("");
      setDocs([]);
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Protocol Error",
        description: "Unable to sync legal brief. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border-white/5 bg-white/[0.02] space-y-6 animate-in fade-in duration-700 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest leading-none">Initialize Legal Brief</h3>
          <p className="text-[10px] text-muted-foreground uppercase italic mt-1.5">Establish parameters for counsel engagement</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Matter Title</Label>
          <div className="relative">
            <Gavel className="absolute left-3 top-3 h-4 w-4 text-accent opacity-50" />
            <Input 
              id="title"
              placeholder="e.g., Enterprise Compliance Audit 2024" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-panel border-white/10 h-11 pl-10 text-white"
              required
            />
          </div>
        </div>

        <DocumentUpload
          onUpload={(fileName: string) =>
            setDocs(prev => [...prev, fileName])
          }
        />
      </div>

      <div className="pt-2 border-t border-white/5">
        <Button 
          type="submit" 
          disabled={isSubmitting || !title.trim()}
          className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-bold rounded-xl shadow-lg shadow-accent/10 transition-all active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              SYNCHRONIZING DOSSIER...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              COMMIT LEGAL BRIEF
            </>
          )}
        </Button>
        <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <p className="text-[8px] font-bold uppercase tracking-widest">Case Integrity Protocol v2.4</p>
        </div>
      </div>
    </form>
  );
}
