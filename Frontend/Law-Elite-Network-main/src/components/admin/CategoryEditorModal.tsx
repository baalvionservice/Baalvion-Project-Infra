
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
import { Textarea } from "@/components/ui/textarea";
import { Building2, Save, Loader2, Link as LinkIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api/client";

interface CategoryEditorModalProps {
  category?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryEditorModal({ category, isOpen, onClose, onSuccess }: CategoryEditorModalProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "Scale",
    order: 1
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        icon: category.icon || "Scale",
        order: category.order || 1
      });
    } else {
      setFormData({ name: "", slug: "", description: "", icon: "Scale", order: 1 });
    }
  }, [category, isOpen]);

  const generateSlug = () => {
    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (category?.id) {
        await apiClient.patch(`/categories/${category.id}`, formData);
      } else {
        await apiClient.post('/categories', { ...formData, is_active: true });
      }
      toast({ title: "Pillar Synchronized", description: "Jurisdictional pillar updated in the global catalog." });
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
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {category ? "Edit Pillar" : "Add Jurisdictional Pillar"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pillar Name</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              onBlur={generateSlug}
              placeholder="e.g. Dispute Resolution"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Display Icon</Label>
              <Input
                value={formData.icon}
                onChange={e => setFormData({...formData, icon: e.target.value})}
                className="h-11 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sort Order</Label>
              <Input
                type="number"
                value={formData.order}
                onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                className="h-11 border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Domain Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="min-h-[100px] border-slate-200 italic"
              placeholder="Provide context for this domain cluster..."
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Cancel</Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Commit Pillar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
