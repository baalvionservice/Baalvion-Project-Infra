
"use client"

import { useEffect, useState, useMemo } from "react";
import { Article } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Globe, Search, X, FileText, Save, Newspaper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const newsCategories = [
  { id: 'updates', name: 'Company News' },
  { id: 'insights', name: 'Global Trade Insights' },
  { id: 'tech', name: 'Technology & AI' },
  { id: 'finance', name: 'Finance & Compliance' },
  { id: 'sustainability', name: 'Sustainability & ESG' },
  { id: 'community', name: 'Community & Partnerships' },
  { id: 'markets', name: 'International Markets' },
  { id: 'reports', name: 'Featured Reports' },
];

export default function AdminNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/news').then(res => res.json()).then(data => {
      setArticles(data);
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

    setSaving(true);
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';

    try {
      const res = await fetch('/api/news', {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(editing),
      });

      if (!res.ok) throw new Error('Unauthorized');
      
      toast({ title: "Article Sync Complete", description: `Article "${editing.title}" ${isNew ? 'published' : 'updated'}.` });
      setEditing(null);
      fetch('/api/news').then(res => res.json()).then(setArticles);
    } catch (err) {
      toast({ title: "Auth Failed", description: "Baalvion Operating System (BOS) update protocol rejected.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Dismantle this news protocol? Permanent action.')) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, { 
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      if (!res.ok) throw new Error('Unauthorized');
      setArticles(articles.filter(a => a.id !== id));
      toast({ title: "Article Purged", description: "Strategic record removed." });
    } catch (err) {
      toast({ title: "Error", description: "Purge protocol failed.", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    return articles.filter(a => 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-gray-500 text-sm font-medium">Syncing Intelligence Buffer...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Intelligence Nexus</h2>
          <p className="text-sm text-gray-500">Manage strategic communications and global trade news.</p>
        </div>
        <Button onClick={() => setEditing({ title: '', slug: '', category: 'updates', author: 'Baalvion Staff', readTime: '2 min read', status: 'Published', content: '', date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })} className="btn-primary rounded-xl h-12 px-6">
          <Plus className="w-4 h-4 mr-2" /> New Strategic Brief
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Search brief archives..." 
          className="pl-12 h-12 bg-white border-gray-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-gray-200">
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">Article Designation</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category Protocol</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Author</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(article => (
              <TableRow key={article.id} className="border-gray-100 hover:bg-gray-50 transition-colors group">
                <TableCell className="pl-8">
                  <div className="flex items-center gap-3">
                    <Newspaper className="w-4 h-4 text-primary" />
                    <span className="font-bold text-gray-900 text-sm">{article.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{article.category}</span>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{article.author}</TableCell>
                <TableCell className="text-right pr-8 space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(article)} className="w-9 h-9 hover:bg-gray-100 rounded-lg">
                    <Pencil className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)} className="w-9 h-9 hover:bg-red-50 text-red-500 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editing?.id ? 'Modify Strategic Brief' : 'Deploy New Brief'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Headline Protocol *</label>
              <Input 
                required
                value={editing?.title || ''} 
                onChange={(e) => setEditing({ ...editing!, title: e.target.value })} 
                className="bg-gray-50 border-gray-200 h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">URL Slug *</label>
                <Input 
                  required
                  value={editing?.slug || ''} 
                  onChange={(e) => setEditing({ ...editing!, slug: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nexus Category *</label>
                <Select value={editing?.category} onValueChange={(val) => setEditing({ ...editing!, category: val })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {newsCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Strategic Author</label>
                <Input 
                  value={editing?.author || ''} 
                  onChange={(e) => setEditing({ ...editing!, author: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Read Duration</label>
                <Input 
                  value={editing?.readTime || ''} 
                  onChange={(e) => setEditing({ ...editing!, readTime: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Strategic Intelligence Content *</label>
              <Textarea 
                required
                value={editing?.content || ''} 
                onChange={(e) => setEditing({ ...editing!, content: e.target.value })} 
                className="bg-gray-50 border-gray-200 min-h-[200px] py-4 resize-none"
                placeholder="Full briefing content..."
              />
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="h-12 px-6 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="btn-primary h-12 px-10 rounded-xl font-bold min-w-[160px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editing?.id ? 'Sync Changes' : 'Publish Protocol'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
