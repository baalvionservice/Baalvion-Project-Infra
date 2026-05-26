
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
  BookOpen,
  Plus,
  Search,
  Filter,
  FileEdit,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { articlesPublicApi } from "@/lib/api/client";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";
import ArticleEditorModal from "./ArticleEditorModal";

export default function ContentManager() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const { toast } = useToast();
  const { adminController } = useAuthContext();

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await articlesPublicApi.list({ limit: 200 });
      setArticles(res.data?.data?.items || res.data?.data || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleDelete = async (id: string) => {
    if (!adminController) return;
    if (!confirm("Confirm permanent redaction of this dossier?")) return;

    try {
      const res = await adminController.deleteArticle({ isAdmin: true, id });
      if (res.success) {
        toast({ title: "Dossier Redacted", description: "Record successfully removed from the global registry." });
        loadArticles();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Redaction Failure", description: err.message });
    }
  };

  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search dossiers..."
            className="pl-9 h-10 border-slate-200"
          />
        </div>
        <Button
          onClick={() => { setSelectedArticle(null); setIsModalOpen(true); }}
          className="bg-[#0B1F3A] text-white font-bold uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Initialize Dossier
        </Button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-24 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 opacity-20" />
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Dossier</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</TableHead>
                <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(art => (
                <TableRow key={art.id} className="hover:bg-slate-50 group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-1">{art.title}</p>
                        <code className="text-[9px] text-slate-400 font-mono">/{art.slug}</code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[8px] font-bold uppercase px-2 py-0.5 border-none ${art.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                      {art.status === 'published' ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : null}
                      {art.status || 'draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/article/${art.slug}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => { setSelectedArticle(art); setIsModalOpen(true); }}>
                        <FileEdit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(art.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ArticleEditorModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadArticles}
      />
    </div>
  );
}
