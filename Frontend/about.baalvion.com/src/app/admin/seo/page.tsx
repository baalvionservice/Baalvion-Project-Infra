
"use client"

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, Save, Loader2, Globe, FileText, 
  ExternalLink, BarChart3, AlertCircle, RefreshCw, 
  Settings2, Eye, ShieldCheck, CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SEONode {
  id: string;
  type: 'Page' | 'Project' | 'Article';
  name: string;
  url: string;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
  };
}

export default function SEOAdmin() {
  const [nodes, setNodes] = useState<SEONode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState<SEONode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const [pRes, prRes, aRes] = await Promise.all([
        fetch('/api/pages'),
        fetch('/api/projects'),
        fetch('/api/news')
      ]);
      
      const pages = await pRes.json();
      const projects = await prRes.json();
      const articles = await aRes.json();

      const combined: SEONode[] = [
        ...pages.map((p: any) => ({ id: p.id, type: 'Page', name: p.title, url: `/${p.slug === 'home' ? '' : p.slug}`, seo: p.seo })),
        ...projects.map((p: any) => ({ id: p.id, type: 'Project', name: p.name, url: `/projects/${p.id}`, seo: p.seo })),
        ...articles.map((a: any) => ({ id: a.id, type: 'Article', name: a.title, url: `/news/${a.category}/${a.slug}`, seo: a.seo })),
      ];

      setNodes(combined);
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    setSaving(true);
    let endpoint = '';
    if (editing.type === 'Page') endpoint = '/api/pages';
    if (editing.type === 'Project') endpoint = '/api/projects';
    if (editing.type === 'Article') endpoint = '/api/news';

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: getAdminHeaders(),
        body: JSON.stringify({ 
          id: editing.id, 
          seo: editing.seo 
        }),
      });

      if (!res.ok) throw new Error('Auth failure');
      
      toast({ title: "SEO Sync Complete", description: `Metadata for "${editing.name}" has been registered.` });
      setEditing(null);
      fetchNodes();
    } catch (err) {
      toast({ title: "Protocol Denied", description: "Authorization failure during SEO write.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredNodes = useMemo(() => {
    return nodes.filter(n => 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [nodes, searchQuery]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Syncing SEO Registry...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">SEO & Search Optimization</h2>
          <p className="text-sm text-gray-500">Manage platform visibility, metadata protocols, and sitemap indexing.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 py-1.5 px-4 font-bold uppercase text-[9px] tracking-widest">
            Sitemap ACTIVE
          </Badge>
          <Button variant="outline" className="h-11 rounded-xl border-gray-200 group">
            <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform" /> Ping Search Engines
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Crawl Status', value: 'Nominal', icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'Sitemap Nodes', value: nodes.length, icon: Globe, color: 'text-primary' },
          { label: 'Meta Coverage', value: `${Math.round((nodes.filter(n => n.seo?.description).length / nodes.length) * 100)}%`, icon: BarChart3, color: 'text-blue-500' },
        ].map((stat, i) => (
          <Card key={i} className="bg-white border-gray-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</CardTitle>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input 
          placeholder="Search pages, projects, or articles..." 
          className="pl-12 h-12 bg-white border-gray-200 shadow-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="bg-white border-gray-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-8">Protocol Type</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Entry Designation</TableHead>
              <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SEO Status</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredNodes.map(node => (
              <TableRow key={node.id} className="group hover:bg-gray-50 transition-colors border-gray-100">
                <TableCell className="pl-8">
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[9px] font-bold uppercase tracking-tighter">
                    {node.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">{node.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                      {node.url} <ExternalLink className="w-2.5 h-2.5" />
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {node.seo?.title && node.seo?.description ? (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Optimized
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
                      <AlertCircle className="w-3.5 h-3.5" /> Metadata Missing
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right pr-8 space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(node)} className="text-[10px] font-bold text-primary uppercase">
                    <Settings2 className="w-3.5 h-3.5 mr-2" /> Configure SEO
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
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  SEO Configuration Node
                </DialogTitle>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Registry: {editing?.name}</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">{editing?.type}</Badge>
            </div>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Meta Title *</label>
                <Input 
                  required
                  value={editing?.seo?.title || ''} 
                  onChange={(e) => setEditing({ ...editing!, seo: { ...editing!.seo, title: e.target.value } })} 
                  className="bg-gray-50 border-gray-200 h-12"
                  placeholder="Appears in search engine results and browser tabs"
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest px-1">
                  <span className={cn(editing?.seo?.title?.length && editing.seo.title.length > 60 ? "text-red-500" : "text-gray-400")}>
                    Length: {editing?.seo?.title?.length || 0} / 60
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Meta Description *</label>
                <Textarea 
                  required
                  value={editing?.seo?.description || ''} 
                  onChange={(e) => setEditing({ ...editing!, seo: { ...editing!.seo, description: e.target.value } })} 
                  className="bg-gray-50 border-gray-200 min-h-[100px] resize-none py-3"
                  placeholder="Concise summary of the node content for search engines."
                />
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest px-1">
                  <span className={cn(editing?.seo?.description?.length && editing.seo.description.length > 160 ? "text-red-500" : "text-gray-400")}>
                    Length: {editing?.seo?.description?.length || 0} / 160
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">OpenGraph Image (URL)</label>
                  <Input 
                    value={editing?.seo?.ogImage || ''} 
                    onChange={(e) => setEditing({ ...editing!, seo: { ...editing!.seo, ogImage: e.target.value } })} 
                    className="bg-gray-50 border-gray-200 h-12"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Canonical URL</label>
                  <Input 
                    value={editing?.seo?.canonical || ''} 
                    onChange={(e) => setEditing({ ...editing!, seo: { ...editing!.seo, canonical: e.target.value } })} 
                    className="bg-gray-50 border-gray-200 h-12"
                    placeholder="https://baalvion.nexus/..."
                  />
                </div>
              </div>
            </div>

            <Card className="bg-gray-900 border-none p-6 text-white overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Eye className="w-4 h-4" /></div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Google Snippet Preview</p>
              <div className="space-y-1">
                <p className="text-blue-400 text-lg hover:underline cursor-pointer truncate">{editing?.seo?.title || editing?.name || 'Protocol Title'}</p>
                <p className="text-emerald-500 text-[11px] truncate">https://baalvion.nexus{editing?.url}</p>
                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                  {editing?.seo?.description || 'Strategic brief content currently under encryption...'}
                </p>
              </div>
            </Card>

            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="h-12 px-6 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="btn-primary h-12 px-10 rounded-xl font-bold min-w-[160px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Synchronize SEO
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
