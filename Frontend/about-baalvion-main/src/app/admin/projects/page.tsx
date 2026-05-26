"use client"

import { useEffect, useState, useMemo } from "react";
import { Project, ProjectStatus, projectCategories } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Loader2, Globe, LayoutGrid, CheckCircle2, Clock, Calendar, Search, Filter, X, Save, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const statuses: ProjectStatus[] = ["Active", "In Development", "Planned"];

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "name" | "priority">("priority");

  useEffect(() => {
    fetch('/api/projects').then(res => res.json()).then(data => {
      setProjects(data);
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
    
    if (!editing.name || !editing.description || !editing.category || !editing.status) {
      toast({ title: "Validation Error", description: "Please fill in all required operational fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const isNew = !editing.id;
    const method = isNew ? 'POST' : 'PUT';
    
    try {
      const res = await fetch('/api/projects', {
        method,
        headers: getAdminHeaders(),
        body: JSON.stringify(editing),
      });
      
      if (!res.ok) throw new Error('Authorization failed');
      
      const updated = await res.json();
      
      if (isNew) {
        setProjects([...projects, updated]);
      } else {
        setProjects(projects.map(p => p.id === updated.id ? updated : p));
      }
      
      setEditing(null);
      toast({ title: "Nexus Updated", description: `Strategic initiative "${updated.name}" has been ${isNew ? 'launched' : 're-architected'}.` });
    } catch (err) {
      toast({ title: "Protocol Denied", description: "Operation failed. Check administrative credentials.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently dismantle this strategic initiative? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/projects?id=${id}`, { 
        method: 'DELETE',
        headers: getAdminHeaders()
      });
      
      if (!res.ok) throw new Error('Authorization failed');
      
      setProjects(projects.filter(p => p.id !== id));
      toast({ title: "Initiative Purged", description: "The node has been removed from the nexus portfolio." });
    } catch (err) {
      toast({ title: "Dismantle Failed", description: "Authorization protocol failure.", variant: "destructive" });
    }
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || p.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
        const matchesFeatured = !featuredOnly || p.isFeatured;
        return matchesSearch && matchesStatus && matchesCategory && matchesFeatured;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "priority") return (a.priority || 10) - (b.priority || 10);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [projects, searchQuery, statusFilter, categoryFilter, featuredOnly, sortBy]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Active': return <CheckCircle2 className="w-3 h-3 text-emerald-500" />;
      case 'In Development': return <Clock className="w-3 h-3 text-amber-500" />;
      case 'Planned': return <Calendar className="w-3 h-3 text-blue-500" />;
      default: return null;
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setFeaturedOnly(false);
    setSortBy("priority");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Strategic Initiatives</h2>
          <p className="text-sm text-gray-500">Manage the foundational infrastructure portfolio.</p>
        </div>
        <Button onClick={() => setEditing({ name: '', description: '', category: projectCategories[0].name, type: '', status: 'Active', isFeatured: false, priority: 10 })} className="btn-primary rounded-xl h-12 px-6">
          <Plus className="w-4 h-4 mr-2" /> New Initiative
        </Button>
      </div>

      <Card className="bg-white border-gray-200 p-4 flex flex-col lg:flex-row items-center gap-4 shadow-sm">
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search projects..." 
            className="pl-10 h-11 bg-gray-50 border-gray-200 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 h-11 px-4 rounded-md">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Featured</span>
            <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11 w-[160px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <SelectValue placeholder="Category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {projectCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-[140px] bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="h-11 w-[140px] bg-gray-50 border-gray-200">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
          {(searchQuery || statusFilter !== "all" || categoryFilter !== "all" || featuredOnly) && (
            <Button variant="ghost" onClick={resetFilters} className="h-11 px-4 text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest">
              <X className="w-3.5 h-3.5 mr-2" /> Clear
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-gray-500 text-sm font-medium">Syncing Portfolio...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-24 text-center bg-white rounded-xl border border-dashed border-gray-200">
              <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-gray-900 font-bold">No initiatives found</h3>
              <p className="text-xs text-gray-400 mt-2 italic">Adjust your search parameters.</p>
            </div>
          ) : filteredProjects.map(project => (
            <Card key={project.id} className="bg-white border-gray-200 hover:border-primary/20 transition-all group overflow-hidden shadow-sm relative">
              <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-colors", project.isFeatured ? "bg-primary" : "bg-gray-100")} />
              <CardHeader className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                    <LayoutGrid className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex gap-1 items-center">
                    {project.isFeatured && <Star className="w-4 h-4 text-primary fill-primary mr-2" />}
                    <Button size="icon" variant="ghost" onClick={() => setEditing(project)} className="w-8 h-8 hover:bg-gray-100 rounded-lg">
                      <Pencil className="w-3.5 h-3.5 text-gray-500" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(project.id)} className="w-8 h-8 hover:bg-red-50 text-red-500 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{project.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-[#FF9900] uppercase tracking-widest">{project.category}</span>
                  <span className="text-gray-300 text-xs">•</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority {project.priority}</span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                    {getStatusIcon(project.status)}
                    <span className="text-[9px] font-bold text-gray-700 uppercase">{project.status}</span>
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-white border-gray-200 max-w-xl p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 border-b border-gray-50 bg-gray-50/50">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              {editing?.id ? 'Edit Strategic Initiative' : 'Launch New Initiative'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Initiative Name *</label>
                <Input 
                  required
                  value={editing?.name || ''} 
                  onChange={(e) => setEditing({ ...editing!, name: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12"
                  placeholder="e.g. Nexus Settlement Node"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Deployment Type *</label>
                <Input 
                  required
                  value={editing?.type || ''} 
                  onChange={(e) => setEditing({ ...editing!, type: e.target.value })} 
                  className="bg-gray-50 border-gray-200 h-12"
                  placeholder="e.g. AI Protocol"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Operational Description *</label>
              <Textarea 
                required
                value={editing?.description || ''} 
                onChange={(e) => setEditing({ ...editing!, description: e.target.value })} 
                className="bg-gray-50 border-gray-200 min-h-[100px] py-4 resize-none"
                placeholder="Detailed objectives and scope of the strategic link..."
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Category *</label>
                <Select value={editing?.category} onValueChange={(val) => setEditing({ ...editing!, category: val })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Operational Status *</label>
                <Select value={editing?.status} onValueChange={(val) => setEditing({ ...editing!, status: val as ProjectStatus })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2 col-span-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Priority (1-100)</label>
                <Input 
                  type="number"
                  value={editing?.priority || 10} 
                  onChange={(e) => setEditing({ ...editing!, priority: parseInt(e.target.value) })} 
                  className="bg-gray-50 border-gray-200 h-12"
                />
              </div>
              <div className="space-y-2 col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mt-auto">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Featured Initiative</label>
                  <p className="text-[9px] text-gray-500">Highlight on homepage nexus.</p>
                </div>
                <Switch 
                  checked={editing?.isFeatured || false} 
                  onCheckedChange={(val) => setEditing({ ...editing!, isFeatured: val })}
                />
              </div>
            </div>

            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)} className="h-12 px-6 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="btn-primary h-12 px-8 rounded-xl font-bold min-w-[160px]">
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" /> {editing?.id ? 'Update Initiative' : 'Deploy Initiative'}
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
