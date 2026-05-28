
"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  Save, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { KeywordMappingRepository, KeywordMapping } from "@/lib/api/repositories/keyword-mapping.repository";
import { Card } from "@/components/ui/card";

/**
 * @fileOverview KeywordManager
 * Executive module for managing the platform's automated internal linking graph.
 */
export default function KeywordManager() {
  const repo = new KeywordMappingRepository();
  const { toast } = useToast();
  
  const [mappings, setMappings] = useState<KeywordMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newMapping, setNewMapping] = useState({ keyword: "", targetSlug: "", priorityScore: 50 });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await repo.getAll();
      setMappings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await repo.save(newMapping);
      toast({ title: "Protocol Committed", description: `Intelligence link for "${newMapping.keyword}" is now active.` });
      setNewMapping({ keyword: "", targetSlug: "", priorityScore: 50 });
      setIsAdding(false);
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failure" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repo.delete(id);
      toast({ title: "Protocol Redacted", description: "The keyword mapping has been removed." });
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "Redaction Failure" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline text-2xl italic text-slate-900 flex items-center gap-3">
            <LinkIcon className="w-6 h-6 text-blue-600" /> Link Intelligence Hub
          </h2>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mt-1">Configure automated cross-dossier linking for SEO authority.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#0B1F3A] text-white hover:bg-slate-800 rounded-xl h-10 px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg">
          <Plus className="w-4 h-4 mr-2" /> New Link Rule
        </Button>
      </header>

      {isAdding && (
        <Card className="border-blue-200 bg-blue-50/30 shadow-xl p-6 rounded-3xl animate-in zoom-in-95 duration-300">
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Trigger Keyword</label>
              <Input 
                placeholder="e.g. Arbitration" 
                value={newMapping.keyword}
                onChange={e => setNewMapping({...newMapping, keyword: e.target.value})}
                className="bg-white border-slate-200 h-10 text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Target Slug</label>
              <Input 
                placeholder="arbitration-law" 
                value={newMapping.targetSlug}
                onChange={e => setNewMapping({...newMapping, targetSlug: e.target.value})}
                className="bg-white border-slate-200 h-10 text-sm font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Priority Score (1-100)</label>
              <Input 
                type="number"
                value={newMapping.priorityScore}
                onChange={e => setNewMapping({...newMapping, priorityScore: parseInt(e.target.value)})}
                className="bg-white border-slate-200 h-10 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 rounded-xl">
                <Save className="w-4 h-4 mr-2" /> Sync Rule
              </Button>
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-400">Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing Link Ledger...</p>
          </div>
        ) : mappings.length === 0 ? (
          <div className="py-24 text-center">
            <LinkIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
            <p className="text-sm italic text-slate-400 uppercase tracking-widest">No intelligence link rules identified.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow className="border-slate-100">
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Keyword Trace</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Destination Dossier</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Priority</TableHead>
                <TableHead className="text-right text-[9px] font-bold uppercase tracking-widest text-slate-500">Audit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((m) => (
                <TableRow key={m.id} className="hover:bg-slate-50 border-slate-50 group">
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 italic">"{m.keyword}"</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">/{m.targetSlug}</code>
                      <ExternalLink className="w-3 h-3 text-slate-300" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-600">{m.priorityScore}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600" onClick={() => handleDelete(m.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
           <div className="space-y-4">
             <div className="flex items-center gap-3">
               <ShieldCheck className="w-6 h-6 text-blue-400" />
               <h4 className="text-sm font-bold uppercase tracking-[0.2em]">SEO Authority Standing</h4>
             </div>
             <p className="text-xs text-slate-400 italic max-w-md leading-relaxed">
               "Automated internal linking generates consistent crawl paths for search engines, establishing high topical authority within the legal domain cluster."
             </p>
           </div>
           <div className="text-center md:text-right">
             <p className="text-4xl font-headline italic">{mappings.length}</p>
             <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Active Link Protocols</p>
           </div>
        </div>
      </div>
    </div>
  );
}
