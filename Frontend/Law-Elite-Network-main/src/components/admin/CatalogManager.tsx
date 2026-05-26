
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
  LayoutGrid,
  Plus,
  Tag as TagIcon,
  FileEdit,
  Trash2,
  Loader2,
  ShieldCheck,
  Building2,
  Database,
  Zap,
  RefreshCw,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { categoriesPublicApi, subcategoriesPublicApi } from "@/lib/api/client";
import { useAuthContext } from "@/context/AuthContext";
import CategoryEditorModal from "./CategoryEditorModal";
import SubcategoryEditorModal from "./SubcategoryEditorModal";
import seedData from "../../../docs/seed-data.json";

export default function CatalogManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<any>(null);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const { toast } = useToast();
  const { adminController } = useAuthContext();

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, subRes] = await Promise.all([
        categoriesPublicApi.list(),
        subcategoriesPublicApi.list()
      ]);
      setCategories(catRes.data?.data || []);
      setSubcategories(subRes.data?.data || []);
    } catch {
      toast({ variant: "destructive", title: "Ledger Sync Failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSeedHierarchy = async () => {
    if (!adminController) return;
    if (!confirm("Synchronize the 8-pillar hierarchy and 80+ specializations?")) return;

    setIsSeeding(true);
    try {
      const res = await adminController.seedHierarchy({ isAdmin: true, seedData });
      if (res.success) {
        toast({ title: "Hierarchy Synchronized", description: `${res.data?.count || 0} records committed to the network.` });
        await loadData();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Seeding Failure", description: err.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleInitializeNetwork = async () => {
    if (!adminController) return;
    if (!confirm("Provision a test member ecosystem for auditing?")) return;

    setIsInitializing(true);
    try {
      const res = await adminController.adminService.initializeTestNetwork(true);
      if (res.success) {
        toast({ title: "Network Initialized", description: `${res.count} members added to the global ledger.` });
        window.location.reload();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Initialization Failure", description: err.message });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDelete = async (coll: 'categories' | 'subcategories', id: string) => {
    if (!adminController) return;
    if (!confirm("Confirm permanent redaction from hierarchy?")) return;

    try {
      const res = await adminController.deleteCategory({ isAdmin: true, id });
      if (res.success) {
        toast({ title: "Record Redacted" });
        loadData();
      }
    } catch {
      toast({ variant: "destructive", title: "Redaction Failure" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      <div className="bg-[#0B1F3A] rounded-[2.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-600/20 transition-all duration-700" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-[0.2em]">Hierarchy Command</h4>
            </div>
            <p className="text-xs text-slate-400 italic leading-relaxed">
              Managing {categories.length} Jurisdictional Pillars and {subcategories.length} Tactical Specializations across the global network.
            </p>
          </div>

          <div className="flex justify-center gap-12">
            <div className="text-center space-y-1">
              <p className="text-4xl font-headline italic">{categories.length}</p>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.3em]">Pillars</p>
            </div>
            <div className="text-center space-y-1">
              <p className="text-4xl font-headline italic">{subcategories.length}</p>
              <p className="text-[8px] font-bold text-blue-400 uppercase tracking-[0.3em]">Specializations</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSeedHierarchy}
              disabled={isSeeding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase text-[9px] tracking-widest h-11 px-6 rounded-xl shadow-lg"
            >
              {isSeeding ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
              Seed Knowledge Hierarchy
            </Button>
            <Button
              onClick={handleInitializeNetwork}
              disabled={isInitializing}
              variant="outline"
              className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10 font-bold uppercase text-[9px] tracking-widest h-11 px-6 rounded-xl"
            >
              {isInitializing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              Provision Test Network
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" /> Jurisdictional Pillars
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedCat(null); setCatModalOpen(true); }} className="h-8 text-[10px] font-bold uppercase text-purple-600 hover:text-purple-700">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600 opacity-20" /></div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Domain Pillar</TableHead>
                    <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(c => (
                    <TableRow key={c.id} className="hover:bg-slate-50 group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{c.name}</p>
                            <code className="text-[9px] text-slate-400 font-mono">/{c.slug}</code>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => { setSelectedCat(c); setCatModalOpen(true); }}>
                            <FileEdit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete('categories', c.id)}>
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
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-indigo-600" /> Tactical Specializations
            </h3>
            <Button variant="ghost" size="sm" onClick={() => { setSelectedSub(null); setSubModalOpen(true); }} className="h-8 text-[10px] font-bold uppercase text-indigo-600 hover:text-indigo-700">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 opacity-20" /></div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Specialization</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pillar</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subcategories.map(s => {
                      const parent = categories.find(c => String(c.id) === String(s.category_id || s.categoryId));
                      return (
                        <TableRow key={s.id} className="hover:bg-slate-50 group border-slate-50">
                          <TableCell>
                            <p className="text-sm font-bold text-slate-900">{s.name}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[8px] font-bold uppercase text-slate-500 bg-slate-50 border-none px-2 py-0.5">
                              {parent?.name?.split(' & ')[0] || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => { setSelectedSub(s); setSubModalOpen(true); }}>
                                <FileEdit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete('subcategories', s.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      </div>

      <CategoryEditorModal category={selectedCat} isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} onSuccess={loadData} />
      <SubcategoryEditorModal subcategory={selectedSub} isOpen={subModalOpen} onClose={() => setSubModalOpen(false)} onSuccess={loadData} />
    </div>
  );
}
