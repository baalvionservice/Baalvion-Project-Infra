import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Upload, Search, Pencil, Trash2, BadgeCheck, Download, ExternalLink, Wallet } from "lucide-react";
import { parseCsv, parseList, parseMoney, parseBool, toCsv } from "@/lib/csv";
import { listPublicInvestors } from "@/lib/publicApi";
import { money, checkRange, type Investor } from "@/lib/investor";

type Draft = {
  name: string; firm: string; title: string; firm_type: string; region: string; location: string;
  headquarters: string; thesis: string; focus_sectors: string; stages: string; portfolio: string;
  check_min: string; check_max: string; aum_usd: string; deals_backed: string;
  website: string; linkedin_url: string; email: string; phone: string; avatar_url: string; is_verified: boolean;
};

const PAGE_SIZE = 50;

const EMPTY: Draft = {
  name: "", firm: "", title: "", firm_type: "", region: "", location: "", headquarters: "", thesis: "",
  focus_sectors: "", stages: "", portfolio: "", check_min: "", check_max: "", aum_usd: "", deals_backed: "",
  website: "", linkedin_url: "", email: "", phone: "", avatar_url: "", is_verified: false,
};

// The column set an import file may carry — also the order of the downloadable template.
const CSV_COLUMNS = [
  "name", "firm", "title", "firm_type", "region", "location", "headquarters", "thesis",
  "focus_sectors", "stages", "portfolio", "check_min", "check_max", "aum_usd", "deals_backed",
  "website", "linkedin_url", "email", "phone", "avatar_url", "is_verified",
];

const toDraft = (i: Investor): Draft => ({
  name: i.name || "", firm: i.firm || "", title: i.title || "", firm_type: i.firm_type || "",
  region: i.region || "", location: i.location || "", headquarters: (i as any).headquarters || "",
  thesis: i.thesis || "", focus_sectors: (i.focus_sectors || []).join(", "), stages: (i.stages || []).join(", "),
  portfolio: (i.portfolio || []).join(", "), check_min: i.check_min == null ? "" : String(i.check_min),
  check_max: i.check_max == null ? "" : String(i.check_max), aum_usd: i.aum_usd == null ? "" : String(i.aum_usd),
  deals_backed: String(i.deals_backed ?? 0), website: i.website || "", linkedin_url: i.linkedin_url || "",
  email: i.email || "", phone: i.phone || "", avatar_url: i.avatar_url || "", is_verified: !!i.is_verified,
});

// Draft (all strings, as typed) → the row shape the investors table expects.
const toRow = (d: Draft) => ({
  name: d.name.trim(),
  firm: d.firm.trim() || null,
  title: d.title.trim() || null,
  firm_type: d.firm_type.trim() || null,
  region: d.region.trim() || null,
  location: d.location.trim() || null,
  headquarters: d.headquarters.trim() || null,
  thesis: d.thesis.trim() || null,
  focus_sectors: parseList(d.focus_sectors),
  stages: parseList(d.stages),
  portfolio: parseList(d.portfolio),
  check_min: parseMoney(d.check_min),
  check_max: parseMoney(d.check_max),
  aum_usd: parseMoney(d.aum_usd),
  deals_backed: Number(d.deals_backed) || 0,
  website: d.website.trim() || null,
  linkedin_url: d.linkedin_url.trim() || null,
  email: d.email.trim() || null,
  phone: d.phone.trim() || null,
  avatar_url: d.avatar_url.trim() || null,
  is_verified: d.is_verified,
});

export default function AdminInvestors() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [rows, setRows] = useState<Investor[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [editing, setEditing] = useState<Investor | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Investor | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ReturnType<typeof toRow>[]>([]);
  const [importSkipped, setImportSkipped] = useState(0);
  const [importName, setImportName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Paged and searched in the database. Selecting every row worked at 8 investors and rendered
  // 21,660 DOM rows in 8 seconds once the directory was ingested.
  const load = async () => {
    setLoading(true);
    try {
      const res = await listPublicInvestors({ q: search.trim() || undefined, page, limit: PAGE_SIZE, sort: "recent" });
      setRows(res.investors as unknown as Investor[]);
      setTotal(res.total);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isAdmin, page, search]);

  const filtered = rows;

  if (user && !isAdmin) return <Navigate to="/dashboard" replace />;

  const openNew = () => { setEditing(null); setDraft(EMPTY); setFormOpen(true); };
  const openEdit = async (i: Investor) => {
    setEditing(i);
    setDraft(toDraft(i));
    setFormOpen(true);
    // The list comes from the public endpoint, which withholds contact fields — pull the full
    // row so editing does not silently blank someone's email and phone.
    const { data } = await supabase.from("investors" as any).select("*").eq("id", i.id).maybeSingle();
    if (data) { setEditing(data as Investor); setDraft(toDraft(data as Investor)); }
  };

  const save = async () => {
    if (!draft.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const row = toRow(draft);
    const { error } = editing
      ? await supabase.from("investors" as any).update(row).eq("id", editing.id)
      : await supabase.from("investors" as any).insert(row);
    setSaving(false);
    if (error) { toast.error(error.message || "Could not save"); return; }
    toast.success(editing ? `${row.name} updated` : `${row.name} added to the directory`);
    setFormOpen(false);
    load();
  };

  // Hide, not delete: a record compiled from filings comes straight back on the next import, so a
  // delete looks like it worked and silently reverses itself.
  const remove = async (i: Investor) => {
    const { error } = await supabase.from("investors" as any).update({ is_hidden: true }).eq("id", i.id);
    if (error) { toast.error(error.message || "Could not remove"); return; }
    toast.success(`${i.name} removed from the public directory`);
    setConfirmDelete(null);
    load();
  };

  const onFile = async (file: File) => {
    setImportName(file.name);
    const parsed = parseCsv(await file.text());
    const valid = parsed.filter((r) => (r.name || "").trim());
    setImportSkipped(parsed.length - valid.length);
    setImportRows(valid.map((r) => toRow({
      ...EMPTY,
      ...Object.fromEntries(CSV_COLUMNS.map((c) => [c, r[c] ?? ""])),
      is_verified: parseBool(r.is_verified || ""),
    } as Draft)));
  };

  const runImport = async () => {
    setImporting(true);
    let ok = 0;
    const failures: string[] = [];
    // Chunked so one oversized paste doesn't become a single doomed request.
    for (let i = 0; i < importRows.length; i += 50) {
      const chunk = importRows.slice(i, i + 50);
      const { error } = await supabase.from("investors" as any).insert(chunk);
      if (error) failures.push(error.message || "unknown error");
      else ok += chunk.length;
    }
    setImporting(false);
    setImportOpen(false);
    setImportRows([]);
    if (ok) toast.success(`Imported ${ok} investor${ok === 1 ? "" : "s"}`);
    if (failures.length) toast.error(`${failures.length} batch(es) failed: ${failures[0]}`);
    load();
  };

  const downloadTemplate = () => {
    const example = [
      "Jane Okafor", "Northwind Capital", "Managing Partner", "VC", "Europe", "London, UK", "London, UK",
      "Backs technical founders at first cheque.", "Fintech; AI", "Pre-Seed; Seed", "Acme; Beacon",
      "50K", "500K", "120M", "12", "https://northwind.vc", "https://linkedin.com/in/example",
      "jane@northwind.vc", "+44 20 0000 0000", "", "yes",
    ];
    const blob = new Blob([toCsv(CSV_COLUMNS, [example])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "investors-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const Field = ({ k, label, placeholder, type = "text" }: { k: keyof Draft; label: string; placeholder?: string; type?: string }) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type={type}
        value={draft[k] as string}
        placeholder={placeholder}
        onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
      />
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Wallet className="w-7 h-7 text-primary" />Investor directory</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading…" : `${total.toLocaleString()} investor${total === 1 ? "" : "s"} published at `}
              {!loading && <Link to="/investors" className="text-primary hover:underline inline-flex items-center gap-1">/investors <ExternalLink className="w-3 h-3" /></Link>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4 mr-2" />Import CSV</Button>
            <Button variant="premium" onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add investor</Button>
          </div>
        </div>

        <form
          className="relative mb-4 max-w-md"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchDraft); }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, firm or city — press Enter" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} />
        </form>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center space-y-3">
            <p className="text-muted-foreground">{rows.length === 0 ? "No investors yet — the public directory is empty." : "No investors match that search."}</p>
            {rows.length === 0 && <Button variant="premium" onClick={openNew}><Plus className="w-4 h-4 mr-2" />Add the first investor</Button>}
          </CardContent></Card>
        ) : (
          <Card className="border-border"><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-3 px-4 font-medium">Investor</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Region</th>
                <th className="py-3 px-4 font-medium">Sectors</th>
                <th className="py-3 px-4 font-medium">Cheque</th>
                <th className="py-3 px-4 font-medium">AUM</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                    <td className="py-3 px-4">
                      <div className="font-medium flex items-center gap-1.5">{i.name}{i.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}</div>
                      <div className="text-xs text-muted-foreground">{i.firm || "—"}</div>
                    </td>
                    <td className="py-3 px-4">{i.firm_type || "—"}</td>
                    <td className="py-3 px-4">{i.region || "—"}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(i.focus_sectors || []).slice(0, 2).map((s) => <Badge key={s} variant="secondary" className="text-[11px] font-normal">{s}</Badge>)}
                        {(i.focus_sectors || []).length > 2 && <span className="text-xs text-muted-foreground">+{(i.focus_sectors || []).length - 2}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{checkRange(i)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{money(i.aum_usd)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(i)}><Trash2 className="w-4 h-4 text-rose-400" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent></Card>
        )}

        {pages > 1 && (
          <nav className="flex items-center justify-between gap-4 pt-5 mt-4 border-t border-border" aria-label="Pagination">
            <Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground tabular-nums">Page {page.toLocaleString()} of {pages.toLocaleString()}</span>
            <Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </nav>
        )}
      </div>

      {/* Add / edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add investor"}</DialogTitle>
            <DialogDescription>
              Name is the only required field. Everything except email and phone shows on the public profile.
            </DialogDescription>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field k="name" label="Name *" placeholder="Jane Okafor" />
            <Field k="firm" label="Firm" placeholder="Northwind Capital" />
            <Field k="title" label="Title" placeholder="Managing Partner" />
            <Field k="firm_type" label="Type" placeholder="VC · Angel · PE · Family Office · CVC" />
            <Field k="region" label="Region" placeholder="Europe" />
            <Field k="location" label="Location" placeholder="London, UK" />
            <Field k="headquarters" label="Headquarters" placeholder="London, UK" />
            <Field k="avatar_url" label="Photo URL" placeholder="https://…" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="thesis">Investment thesis</Label>
            <Textarea id="thesis" rows={3} value={draft.thesis} placeholder="What they back, and why."
              onChange={(e) => setDraft((d) => ({ ...d, thesis: e.target.value }))} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field k="focus_sectors" label="Sectors" placeholder="Fintech, AI" />
            <Field k="stages" label="Stages" placeholder="Pre-Seed, Seed" />
            <Field k="portfolio" label="Notable portfolio" placeholder="Acme, Beacon" />
          </div>
          <p className="text-xs text-muted-foreground -mt-2">Separate multiple values with commas.</p>

          <div className="grid sm:grid-cols-4 gap-4">
            <Field k="check_min" label="Cheque min" placeholder="50K" />
            <Field k="check_max" label="Cheque max" placeholder="500K" />
            <Field k="aum_usd" label="AUM" placeholder="120M" />
            <Field k="deals_backed" label="Deals backed" placeholder="12" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field k="website" label="Website" placeholder="https://northwind.vc" />
            <Field k="linkedin_url" label="LinkedIn" placeholder="https://linkedin.com/in/…" />
            <Field k="email" label="Email (never public)" placeholder="jane@northwind.vc" />
            <Field k="phone" label="Phone (never public)" placeholder="+44 20 0000 0000" />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch id="verified" checked={draft.is_verified} onCheckedChange={(v) => setDraft((d) => ({ ...d, is_verified: v }))} />
            <Label htmlFor="verified" className="cursor-pointer">Verified — only tick this once you have confirmed the investor is real and active.</Label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button variant="premium" onClick={save} disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Add to directory"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV import */}
      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) { setImportRows([]); setImportName(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import investors from CSV</DialogTitle>
            <DialogDescription>
              One row per investor. The <code>name</code> column is required; rows without one are skipped.
              Cheque and AUM accept <code>50K</code>, <code>$1.2M</code> or a plain number.
            </DialogDescription>
          </DialogHeader>

          <Button variant="outline" size="sm" className="w-fit" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />Download template
          </Button>

          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />

          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-border rounded-xl py-10 text-center hover:border-primary/50 transition-colors"
          >
            <Upload className="w-6 h-6 mx-auto mb-2 text-primary" />
            <div className="text-sm font-medium">{importName || "Choose a CSV file"}</div>
            <div className="text-xs text-muted-foreground mt-1">or click to browse</div>
          </button>

          {importRows.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-sm">
                <span className="font-semibold text-foreground">{importRows.length}</span> investor{importRows.length === 1 ? "" : "s"} ready to import
                {importSkipped > 0 && <span className="text-muted-foreground"> · {importSkipped} row{importSkipped === 1 ? "" : "s"} skipped (no name)</span>}
              </p>
              <div className="text-xs text-muted-foreground">
                First few: {importRows.slice(0, 3).map((r) => r.name).join(", ")}{importRows.length > 3 ? "…" : ""}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button variant="premium" onClick={runImport} disabled={!importRows.length || importing}>
              {importing ? "Importing…" : `Import ${importRows.length || ""}`.trim()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.name} from the directory?</AlertDialogTitle>
            <AlertDialogDescription>
              The record and its filings stay in the database, but it disappears from the public directory,
              the location pages and the sitemap. Re-running the SEC import will not bring it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && remove(confirmDelete)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
