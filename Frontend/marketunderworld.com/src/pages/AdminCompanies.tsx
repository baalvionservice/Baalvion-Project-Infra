import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, EyeOff, ExternalLink, Building2 } from "lucide-react";
import { listPublicCompanies, type PublicCompany } from "@/lib/publicApi";
import { money } from "@/lib/investor";
import { founderPath } from "@/lib/directory-url";

const PAGE_SIZE = 50;
const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "—";

// Compiled records are read-only here on purpose: they are a copy of the public record, and the
// only correction that survives a re-ingest is suppression, so that is the only action offered.
export default function AdminCompanies() {
  const { user } = useAuth();
  const isAdmin = !!user?.roles?.includes("admin");
  const [rows, setRows] = useState<PublicCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirmHide, setConfirmHide] = useState<PublicCompany | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listPublicCompanies({ q: search.trim() || undefined, page, limit: PAGE_SIZE, sort: "recent" });
      setRows(res.companies);
      setTotal(res.total);
      setPages(res.pages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isAdmin, page, search]);

  if (user && !isAdmin) return <Navigate to="/dashboard" replace />;

  const hide = async (c: PublicCompany) => {
    const { error } = await supabase.from("companies" as any).update({ is_hidden: true }).eq("id", c.id);
    if (error) { toast.error(error.message || "Could not hide"); return; }
    toast.success(`${c.name} removed from the public directory`);
    setConfirmHide(null);
    load();
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Building2 className="w-7 h-7 text-primary" />Companies</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Loading…" : `${total.toLocaleString()} compan${total === 1 ? "y" : "ies"} published at `}
              {!loading && <Link to="/founders" className="text-primary hover:underline inline-flex items-center gap-1">/founders <ExternalLink className="w-3 h-3" /></Link>}
            </p>
          </div>
        </div>

        <form className="relative mb-4 max-w-md" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(draft); }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search company or city — press Enter" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </form>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded" />)}</div>
        ) : rows.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center text-muted-foreground">No companies match that search.</CardContent></Card>
        ) : (
          <Card className="border-border"><CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-3 px-4 font-medium">Company</th>
                <th className="py-3 px-4 font-medium">Sector</th>
                <th className="py-3 px-4 font-medium">Location</th>
                <th className="py-3 px-4 font-medium text-right">Raised</th>
                <th className="py-3 px-4 font-medium">Last filing</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                    <td className="py-3 px-4">
                      <Link to={founderPath(c)} className="font-medium text-primary hover:underline">{c.name}</Link>
                      <div className="text-xs text-muted-foreground">{c.source === "sec_form_d" ? `SEC CIK ${c.cik}` : "Added manually"}</div>
                    </td>
                    <td className="py-3 px-4"><Badge variant="secondary" className="font-normal text-[11px]">{c.industry_group || "—"}</Badge></td>
                    <td className="py-3 px-4">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{money(c.total_raised_usd)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{fmtDate(c.last_filing_date)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {c.source_url && (
                        <Button variant="ghost" size="sm" asChild><a href={c.source_url} target="_blank" rel="noreferrer" title="View filing"><ExternalLink className="w-4 h-4" /></a></Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setConfirmHide(c)} title="Remove from directory"><EyeOff className="w-4 h-4 text-rose-500" /></Button>
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

      <AlertDialog open={!!confirmHide} onOpenChange={(o) => !o && setConfirmHide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmHide?.name} from the directory?</AlertDialogTitle>
            <AlertDialogDescription>
              The record stays in the database and its filings are kept, but it disappears from the public
              directory, the location pages and the sitemap. Re-running the SEC import will not bring it back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmHide && hide(confirmHide)}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
