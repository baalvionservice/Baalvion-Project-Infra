"use client"

import { useEffect, useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { OperationalUpdate } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ClipboardList, Search, Filter, ArrowRight, ExternalLink, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UpdatesClient() {
  const [updates, setUpdates] = useState<OperationalUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetch('/api/updates')
      .then(res => res.json())
      .then(data => {
        setUpdates(data);
        setLoading(false);
      });
  }, []);

  const categories = Array.from(new Set(updates.map(u => u.category)));

  const filteredUpdates = useMemo(() => {
    return updates.filter(u => {
      const matchesSearch = u.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.updateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           u.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || u.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [updates, searchQuery, categoryFilter]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing Operational Logs...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1 pt-48 pb-32">
        <div className="section-container">
          {/* Header */}
          <div className="max-w-4xl mb-24 space-y-8 animate-fade-in">
            <span className="section-label">Strategic Transparency</span>
            <h1 className="text-gray-900 mb-8 font-bold leading-tight tracking-tight">Company <br/>Updates Log</h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl font-medium">
              A real-time, transparent registry of strategic technical milestones, systemic upgrades, and global node developments across the Baalvion Nexus.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-16 animate-fade-in stagger-1">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search log by title, ID, or technical tag..." 
                className="pl-12 h-14 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-[240px] h-14 bg-gray-50 border-gray-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Log List */}
          <div className="space-y-6 animate-fade-in stagger-2">
            {filteredUpdates.length === 0 ? (
              <div className="py-32 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-gray-900">Log Buffer Empty</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">No matching updates found in the strategic registry. Adjust your filters.</p>
              </div>
            ) : filteredUpdates.map((update) => (
              <Card key={update.id} className="group overflow-hidden border-gray-100 hover:border-primary/20 transition-all hover:shadow-lg bg-white rounded-2xl">
                <div className="flex flex-col md:flex-row">
                  {/* Status Indicator Bar */}
                  <div className={cn(
                    "w-full md:w-2 h-2 md:h-auto transition-colors",
                    update.impactLevel === 'High' ? 'bg-red-500' : update.impactLevel === 'Medium' ? 'bg-amber-500' : 'bg-gray-200'
                  )} />
                  
                  <div className="p-8 md:p-10 flex-1 space-y-8">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">{update.updateId}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{update.category}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors leading-tight">
                          {update.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900 uppercase tracking-tighter">{update.date}</p>
                        <div className="flex items-center gap-1.5 justify-end mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {update.status === 'Completed' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Clock className="w-3 h-3 text-amber-500" />}
                          {update.status}
                        </div>
                      </div>
                    </div>

                    <p className="text-lg text-gray-600 leading-relaxed max-w-4xl">
                      {update.description}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-gray-50">
                      <div className="flex flex-wrap gap-2">
                        {update.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-gray-50 text-gray-500 hover:bg-gray-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      
                      {update.reference && (
                        <a 
                          href={update.reference} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-[10px] font-bold text-primary hover:text-gray-900 uppercase tracking-widest transition-colors"
                        >
                          Technical Documentation <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {update.followUpActions && (
                      <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex gap-4 items-start">
                        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest">Next Protocols</p>
                          <p className="text-sm text-gray-600 italic">"{update.followUpActions}"</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}