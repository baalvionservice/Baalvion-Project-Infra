"use client"

import { useEffect, useState, useMemo } from "react";
import { EcosystemItem } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Pencil, Trash2, Plus, Database, Globe, Layers, Search, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const layers = ["Infrastructure", "Intelligence", "Governance", "Commerce", "Finance"];

export default function EcosystemAdmin() {
  const [items, setItems] = useState<EcosystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<EcosystemItem> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/ecosystem').then(res => res.json()).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const getAdminHeaders = () => {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      'x-admin-key': token || ''
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (!editing.name || !editing.description || !editing.layer) {
      toast({ title: "Validation Error", description: "Required registry data missing.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';
    
    try {
      const res = await fetch('/api/ecosystem', {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(editing),
      });

      if (!res.ok) throw new Error('Unauthorized');

      toast({ title: "Registry Synchronized", description: `Layer "${editing.name}" ${isNew ? 'added' : 'updated'} successfully.` });
      setEditing(null);
      fetch('/api/ecosystem').then(res => res.json()).then(setItems);
    } catch (err) {
      toast({ title: "Authorization Failure", description: "Strategic registry update protocol denied.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to dismantle this ecosystem layer? This will remove all registry links.')) return;
    try {
      const res = await fetch(`/api/ecosystem?id=${id}`, { 
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized');
      setItems(items.filter(i => i.id !== id));
      toast({ title: "Layer Dismantled", description: "Node removed from the global trade nexus." });
    } catch (err) {
      toast({ title: "Error", description: "Dismantle protocol failure.", variant: "destructive" });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.layer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-gray-500 text-sm font-medium">Syncing Ecosystem Registry...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ecosystem Registry</h2>
          <p className="text-sm text-gray-500">Manage operational layers and infrastructure nodes.</p>
        </div>
        <Button onClick={() => setEditing({ layer: 'Infrastructure', name: '', description: '', domain: '' })} className="btn-primary rounded-xl h-12 px-6">
          <Plus className="w-4 h-4 mr-2" /> Add Registry Item
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search registry nodes..." 
            className="pl-12 h-12 bg-white border-gray-200 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-900" />
            </button>
          )}
        </div>
      </div>

      <Card className="bg-white border-gray-200 p-0 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-gray-200">
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">Layer Protocol</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item Designation</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nexus Domain</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-10">
                    <Database className="w-10 h-10 text-gray-900" />
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">No matching nodes found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredItems.map(item => (
              <TableRow key={item.id} className="border-gray-100 hover:bg-gray-50 transition-colors group">
                <TableCell className="pl-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      <Layers className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-900 text-xs uppercase tracking-wider">{item.layer}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium text-gray-900 text-sm">{item.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs font-mono text-gray-500 group-hover:text-primary transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    {item.domain || 'internal.nexus'}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8 space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(item)} className="w-9 h-9 hover:bg-gray-100 rounded-lg">
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="w-9 h-9 hover:bg-red-50 text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-white border-gray-200 p-0 max-w-lg overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              {editing?.id ? 'Edit Registry Node' : 'New Ecosystem Node'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Layer Protocol *</label>
                <Select value={editing?.layer} onValueChange={(val) => setEditing({ ...editing!, layer: val as any })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {layers.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Item Designation *</label>
                <Input 
                  required
                  value={editing?.name || ''} 
                  onChange={(e) => setEditing({ ...editing!, name: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12"
                  placeholder="e.g. Nexus Settlement"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Operational Brief *</label>
              <Textarea 
                required
                value={editing?.description || ''} 
                onChange={(e) => setEditing({ ...editing!, description: e.target.value })} 
                className="bg-gray-50 border-gray-200 min-h-[120px] py-4 resize-none"
                placeholder="Core functionality and purpose in the nexus..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Primary Domain</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  value={editing?.domain || ''} 
                  onChange={(e) => setEditing({ ...editing!, domain: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12 pl-12"
                  placeholder="node.baalvion.nexus"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="h-12 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="btn-primary h-12 px-8 rounded-xl font-bold min-w-[140px]">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Syncing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> Deploy Node
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
