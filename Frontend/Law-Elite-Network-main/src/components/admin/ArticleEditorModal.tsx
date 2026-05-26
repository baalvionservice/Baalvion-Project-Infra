
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  BookOpen,
  Save,
  Loader2,
  Tag,
  Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categoriesPublicApi, subcategoriesPublicApi } from "@/lib/api/client";
import { useAuthContext } from "@/context/AuthContext";

interface ArticleEditorModalProps {
  article?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArticleEditorModal({ article, isOpen, onClose, onSuccess }: ArticleEditorModalProps) {
  const { adminController } = useAuthContext();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    categoryId: "",
    subcategoryId: "",
    summary: "",
    content: "",
    keywords: "",
    isPillar: false,
    readingTime: 5,
    featured: false
  });

  useEffect(() => {
    if (!isOpen) return;
    Promise.all([categoriesPublicApi.list(), subcategoriesPublicApi.list()])
      .then(([catRes, subRes]) => {
        setCategories(catRes.data?.data || []);
        setSubcategories(subRes.data?.data || []);
      })
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || "",
        slug: article.slug || "",
        categoryId: String(article.category_id || article.categoryId || ""),
        subcategoryId: String(article.subcategory_id || article.subcategoryId || ""),
        summary: article.excerpt || article.summary || "",
        content: article.content || "",
        keywords: (article.tags || article.keywords || []).join(", "),
        isPillar: article.isPillar || false,
        readingTime: article.readingTime || 5,
        featured: article.featured || false
      });
    } else {
      setFormData({ title: "", slug: "", categoryId: "", subcategoryId: "", summary: "", content: "", keywords: "", isPillar: false, readingTime: 5, featured: false });
    }
  }, [article, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminController) return;

    setIsSaving(true);
    try {
      const id = article?.id || `art_${Date.now()}`;
      const payload = {
        ...formData,
        id,
        keywords: formData.keywords.split(",").map(k => k.trim()).filter(Boolean),
        views: article?.views || 0,
        createdAt: article?.createdAt || null
      };

      const res = await adminController.saveArticle({ isAdmin: true, data: payload });
      if (res.success) {
        toast({ title: "Dossier Committed", description: "Strategic intelligence has been synchronized." });
        onSuccess();
        onClose();
      } else {
        throw new Error(res.message);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failure", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlug = () => {
    if (formData.slug) return;
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 border-none shadow-2xl rounded-[2.5rem] bg-white flex flex-col">
        <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50 rounded-t-[2.5rem] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#0B1F3A] flex items-center justify-center text-white shadow-xl">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-slate-900">
                  {article ? "Edit Strategic Dossier" : "Initialize New Dossier"}
                </DialogTitle>
                <DialogDescription className="italic font-medium text-slate-500">Author high-fidelity legal intelligence guides.</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-4">
          <form id="article-form" onSubmit={handleSave} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Dossier Heading</Label>
                  <Input
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    onBlur={generateSlug}
                    placeholder="e.g. Arbitration Law Protocol"
                    className="h-12 border-slate-200 text-lg font-bold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Discovery Slug</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                    <Input
                      value={formData.slug}
                      onChange={e => setFormData({...formData, slug: e.target.value})}
                      className="h-12 pl-11 font-mono text-xs border-slate-200 bg-slate-50/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Jurisdiction</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={val => setFormData({...formData, categoryId: val, subcategoryId: ""})}
                    >
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue placeholder="Select Pillar" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-slate-500">Specialization</Label>
                    <Select
                      value={formData.subcategoryId}
                      onValueChange={val => setFormData({...formData, subcategoryId: val})}
                      disabled={!formData.categoryId}
                    >
                      <SelectTrigger className="h-12 border-slate-200">
                        <SelectValue placeholder="Select Spec" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategories
                          .filter(s => String(s.category_id || s.categoryId) === formData.categoryId)
                          .map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Executive Summary</Label>
                  <Textarea
                    value={formData.summary}
                    onChange={e => setFormData({...formData, summary: e.target.value})}
                    placeholder="Concise overview..."
                    className="min-h-[120px] border-slate-200 italic font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Keywords</Label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                    <Input
                      value={formData.keywords}
                      onChange={e => setFormData({...formData, keywords: e.target.value})}
                      placeholder="law, strategy"
                      className="h-12 pl-11 border-slate-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Content (HTML)</Label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                placeholder="<h2>Matter Analysis</h2>..."
                className="min-h-[300px] font-mono text-sm border-slate-200 p-8 bg-slate-50/30 rounded-3xl"
                required
              />
            </div>
          </form>
        </div>

        <DialogFooter className="p-8 border-t border-slate-100 bg-slate-50/50 rounded-b-[2.5rem] shrink-0">
          <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 font-bold uppercase text-[10px]">Cancel</Button>
          <Button
            form="article-form"
            type="submit"
            disabled={isSaving}
            className="bg-[#0B1F3A] hover:bg-slate-800 text-white px-10 h-14 rounded-2xl font-bold uppercase text-[10px] shadow-2xl"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Commit Dossier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
