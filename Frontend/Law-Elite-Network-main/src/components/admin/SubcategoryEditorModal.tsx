
"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tag, Save, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { categoriesPublicApi, apiClient } from "@/lib/api/client";

interface SubcategoryEditorModalProps {
  subcategory?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubcategoryEditorModal({ subcategory, isOpen, onClose, onSuccess }: SubcategoryEditorModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    categoryId: ""
  });

  useEffect(() => {
    if (!isOpen) return;
    categoriesPublicApi.list()
      .then(res => setCategories(res.data?.data || []))
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (subcategory) {
      setFormData({
        name: subcategory.name || "",
        slug: subcategory.slug || "",
        categoryId: String(subcategory.category_id || subcategory.categoryId || "")
      });
    } else {
      setFormData({ name: "", slug: "", categoryId: "" });
    }
  }, [subcategory, isOpen]);

  const generateSlug = () => {
    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { name: formData.name, slug: formData.slug, category_id: formData.categoryId, is_active: true };
      if (subcategory?.id) {
        await apiClient.patch(`/subcategories/${subcategory.id}`, payload);
      } else {
        await apiClient.post('/subcategories', payload);
      }
      toast({ title: "Specialization Committed", description: "Hierarchy record updated successfully." });
      onSuccess();
      onClose();
    } catch {
      toast({ variant: "destructive", title: "Sync Failure" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2rem] bg-white border-none shadow-2xl">
        <DialogHeader className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
              <Tag className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {subcategory ? "Edit Specialization" : "Add Specialization"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pillar Domain</Label>
            <Select
              value={formData.categoryId}
              onValueChange={val => setFormData({...formData, categoryId: val})}
            >
              <SelectTrigger className="h-11 border-slate-200">
                <SelectValue placeholder="Select Parent Pillar" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Specialization Name</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              onBlur={generateSlug}
              placeholder="e.g. Mergers & Acquisitions"
              className="h-11 border-slate-200"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Identifier Slug</Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3.5 w-3.5 h-3.5 text-slate-300" />
              <Input
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: e.target.value})}
                className="h-11 pl-9 border-slate-200 font-mono text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Commit Logic
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
