"use client"

import { useEffect, useState, useMemo } from "react";
import { OperationalUpdate, UpdateCategory, UpdateStatus, ImpactLevel } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Search, X, ClipboardList, Save, Sparkles, Filter, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { analyzeUpdate } from "@/ai/flows/analyze-update-flow";

const categories: UpdateCategory[] = ['Finance', 'Banking', 'Platform', 'System', 'Legal', 'Partner', 'Payment Gateway', 'HR', 'Other'];
const statuses: UpdateStatus[] = ['Pending', 'Completed', 'In Progress'];
const impactLevels: ImpactLevel[] = ['Low', 'Medium', 'High'];

export default function UpdatesAdmin() {
  const [updates, setUpdates] = useState<OperationalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [editing, setEditing] = useState<Partial<OperationalUpdate> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      setUpdates(data);
    } finally {
      setLoading(false);
    }
  };

  const getAdminHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'x-admin-key': token || ''
    };
  };

  const handleAIAnalyze = async () => {
    if (!editing?.title || !editing?.description) {
      toast({ title: "Insufficient Data", description: "Please provide a title and description for AI analysis.", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    try {
      const result = await analyzeUpdate({
        title: editing.title,
        description: editing.description,
        category: editing.category || 'Platform'
      });

      setEditing({
        ...editing,
        impactLevel: result.suggestedImpactLevel,
        tags: result.suggestedTags,
        updateId: result.suggestedUpdateId
      });

      toast({ title: "AI Analysis Complete", description: "Updated fields based on strategic assessment." });
    } catch (err) {
      toast({ title: "AI Error", description: "Could not perform strategic analysis.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    setSaving(true);
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch('/api/updates', {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(editing),
      });

      if (!res.ok) throw new Error('Unauthorized');
      
      toast({ title: "Log Synchronized", description: `Update "${editing.title}" ${isNew ? 'registered' : 'modified'}.` });
      setEditing(null);
      fetchUpdates();
    } catch (err) {
      toast({ title: "Auth Failure", description: "Strategic registry write protocol rejected.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dismantle this operational record? This action is permanent.')) return;
    try {
      const res = await fetch(`/api/updates?id=${id}`, { 
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized');
      setUpdates(updates.filter(u => u.id !== id));
      toast({ title: "Record Purged", description: "Operational node removed from nexus log." });
    } catch (err) {
      toast({ title: "Error", description: "Purge protocol denied.", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    return updates.filter(u => {
      const matchesSearch = u.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.updateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || u.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [updates, searchQuery, categoryFilter]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Syncing Operational Logs...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Company Updates Log</h2>
          <p className="text-sm text-gray-500">Track and manage operational milestones and systemic changes.</p>
        </div>
        <Button onClick={() => setEditing({ updateId: '', title: '', description: '', category: 'Platform', date: new Date().toISOString().split('T')[0], status: 'Pending', impactLevel: 'Medium', tags: [], responsiblePerson: 'Operational Team' })} className="btn-primary rounded-xl h-12 px-6">
          <Plus className="w-4 h-4 mr-2" /> Log New Update
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search log by title, ID, or tags..." 
            className="pl-12 h-12 bg-white border-gray-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full lg:w-[200px] h-12 bg-white">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <SelectValue placeholder="Category Filter" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-gray-200">
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">ID / Date</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Designation</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category / Status</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Impact</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-32 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">No matching updates in nexus buffer</p>
                </TableCell>
              </TableRow>
            ) : filtered.map(update => (
              <TableRow key={update.id} className="group hover:bg-gray-50 transition-colors border-gray-100">
                <TableCell className="pl-8">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-900">{update.updateId}</p>
                    <p className="text-[10px] text-gray-400 uppercase">{update.date}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{update.title}</p>
                    <div className="flex gap-1">
                      {update.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 lowercase">#{tag}</span>
                      ))}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter py-0 font-bold bg-primary/5 text-primary border-primary/10">
                      {update.category}
                    </Badge>
                    <p className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      update.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'
                    )}>{update.status}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      update.impactLevel === 'High' ? 'bg-red-500 animate-pulse' : update.impactLevel === 'Medium' ? 'bg-amber-500' : 'bg-gray-300'
                    )} />
                    <span className="text-[10px] font-bold text-gray-600 uppercase">{update.impactLevel}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8 space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(update)} className="w-9 h-9 hover:bg-gray-100 rounded-lg">
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(update.id)} className="w-9 h-9 hover:bg-red-50 text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-white max-w-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {editing?.id ? 'Modify Strategic Update' : 'Log New Operational Update'}
              </DialogTitle>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAIAnalyze}
                disabled={analyzing}
                className="h-9 px-4 rounded-full border-primary/20 hover:bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest"
              >
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                Analyze Impact
              </Button>
            </div>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Update ID *</label>
                <Input 
                  required
                  value={editing?.updateId || ''} 
                  onChange={(e) => setEditing({ ...editing!, updateId: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-11 font-mono"
                  placeholder="e.g. U003"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Registry Date *</label>
                <Input 
                  type="date"
                  required
                  value={editing?.date || ''} 
                  onChange={(e) => setEditing({ ...editing!, date: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Update Title *</label>
              <Input 
                required
                value={editing?.title || ''} 
                onChange={(e) => setEditing({ ...editing!, title: e.target.value })} 
                className="bg-gray-50 border-gray-200 h-11"
                placeholder="Brief summary of the update..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Detailed Description *</label>
              <Textarea 
                required
                value={editing?.description || ''} 
                onChange={(e) => setEditing({ ...editing!, description: e.target.value })} 
                className="bg-gray-50 border-gray-200 min-h-[100px] resize-none py-3"
                placeholder="Detailed account of systemic changes..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Operational Category *</label>
                <Select value={editing?.category} onValueChange={(val) => setEditing({ ...editing!, category: val as UpdateCategory })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Responsible Entity *</label>
                <Input 
                  required
                  value={editing?.responsiblePerson || ''} 
                  onChange={(e) => setEditing({ ...editing!, responsiblePerson: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-11"
                  placeholder="Team or Personnel..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Status Protocol *</label>
                <Select value={editing?.status} onValueChange={(val) => setEditing({ ...editing!, status: val as UpdateStatus })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Strategic Impact *</label>
                <Select value={editing?.impactLevel} onValueChange={(val) => setEditing({ ...editing!, impactLevel: val as ImpactLevel })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {impactLevels.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Follow-up Protocols</label>
              <Input 
                value={editing?.followUpActions || ''} 
                onChange={(e) => setEditing({ ...editing!, followUpActions: e.target.value })} 
                className="bg-gray-50 border-gray-200 h-11"
                placeholder="Pending actions after deployment..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Reference Links</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  value={editing?.reference || ''} 
                  onChange={(e) => setEditing({ ...editing!, reference: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-11 pl-10"
                  placeholder="https://docs.baalvion.nexus/..."
                />
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="h-12 px-6 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="btn-primary h-12 px-10 rounded-xl font-bold min-w-[160px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editing?.id ? 'Sync Registry' : 'Deploy Log'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}