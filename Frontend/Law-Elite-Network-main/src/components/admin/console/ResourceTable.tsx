"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { ResourceConfig, Field } from "./registry";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";

const ALL = "__all__";
const LIMIT = 20;

export default function ResourceTable({ config }: { config: ResourceConfig }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: LIMIT, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const filterKey = JSON.stringify(filters);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit: LIMIT };
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== ALL) params[k] = v; });
      if (search.trim()) params.search = search.trim();
      const res = await adminApi.list(config.resource, params);
      setItems(res.items || []);
      setPagination(res.pagination || { total: 0, page: 1, limit: LIMIT, totalPages: 0 });
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setItems([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.resource, page, filterKey, search]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const runAction = async (row: any, action: { key: string; label: string; confirm?: string; run: (r: any) => Promise<any> }) => {
    if (action.confirm && !window.confirm(action.confirm)) return;
    setBusyId(`${row.id}:${action.key}`);
    try {
      await action.run(row);
      toast({ title: `${action.label} succeeded` });
      await load();
    } catch (e: any) {
      toast({ title: `${action.label} failed`, description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (row: any) => {
    if (!window.confirm(`Delete this ${config.title.replace(/s$/, "").toLowerCase()}? This cannot be undone.`)) return;
    setBusyId(`${row.id}:delete`);
    try {
      await adminApi.remove(config.resource, row.id);
      toast({ title: "Deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const openCreate = () => {
    const init: Record<string, any> = {};
    (config.fields || []).forEach((f) => { init[f.key] = f.type === "boolean" ? false : ""; });
    setForm(init); setEditing(null); setDialogOpen(true);
  };
  const openEdit = (row: any) => {
    const init: Record<string, any> = {};
    (config.fields || []).forEach((f) => { init[f.key] = row[f.key] ?? (f.type === "boolean" ? false : ""); });
    setForm(init); setEditing(row); setDialogOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      (config.fields || []).forEach((f) => {
        let v = form[f.key];
        if (v === "" || v === undefined) return;
        if (f.type === "number") v = Number(v);
        payload[f.key] = v;
      });
      if (editing) await adminApi.update(config.resource, editing.id, payload);
      else await adminApi.create(config.resource, payload);
      toast({ title: editing ? "Saved" : "Created" });
      setDialogOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const hasRowActions = (config.actions && config.actions.length) || config.canEdit || config.canDelete;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {config.searchPlaceholder && (
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder={config.searchPlaceholder}
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
          </div>
        )}
        {(config.filters || []).map((f) => (
          <Select
            key={f.key}
            value={filters[f.key] || ALL}
            onValueChange={(v) => { setPage(1); setFilters((prev) => ({ ...prev, [f.key]: v })); }}
          >
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={f.label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All {f.label.toLowerCase()}</SelectItem>
              {f.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => load()} title="Refresh"><RefreshCw className="w-4 h-4" /></Button>
          {config.canCreate && config.fields && (
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> New</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {config.columns.map((c) => <TableHead key={c.key} className={c.className}>{c.label}</TableHead>)}
                {hasRowActions && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={config.columns.length + 1} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-primary" /></TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={config.columns.length + 1} className="h-32 text-center text-destructive"><AlertCircle className="w-5 h-5 inline mr-1" />{error}</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={config.columns.length + 1} className="h-32 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                items.map((row) => (
                  <TableRow key={row.id}>
                    {config.columns.map((c) => (
                      <TableCell key={c.key} className={c.className}>
                        {c.render ? c.render(row) : (row[c.key] ?? "—")}
                      </TableCell>
                    ))}
                    {hasRowActions && (
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="inline-flex gap-1.5 justify-end">
                          {(config.actions || []).filter((a) => !a.visible || a.visible(row)).map((a) => (
                            <Button key={a.key} size="sm" variant={a.variant || "secondary"} disabled={busyId === `${row.id}:${a.key}`} onClick={() => runAction(row, a)}>
                              {busyId === `${row.id}:${a.key}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : a.label}
                            </Button>
                          ))}
                          {config.canEdit && config.fields && (
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(row)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                          )}
                          {config.canDelete && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" disabled={busyId === `${row.id}:delete`} onClick={() => onDelete(row)} title="Delete">
                              {busyId === `${row.id}:delete` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{pagination.total} total · page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /> Prev</Button>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? `Edit ${config.title.replace(/s$/, "")}` : `New ${config.title.replace(/s$/, "")}`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {(config.fields || []).map((f: Field) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={f.key}>{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.key} value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                ) : f.type === "select" ? (
                  <Select value={String(form[f.key] ?? "")} onValueChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}>
                    <SelectTrigger><SelectValue placeholder={`Select ${f.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{(f.options || []).map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                ) : f.type === "boolean" ? (
                  <div className="flex items-center gap-2"><Switch id={f.key} checked={!!form[f.key]} onCheckedChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))} /><span className="text-sm text-muted-foreground">{form[f.key] ? "Enabled" : "Disabled"}</span></div>
                ) : (
                  <Input id={f.key} type={f.type === "number" ? "number" : "text"} value={form[f.key] ?? ""} placeholder={f.placeholder} onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}{editing ? "Save changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
