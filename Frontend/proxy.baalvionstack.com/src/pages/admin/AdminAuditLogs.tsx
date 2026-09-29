import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2, FileDown } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useAdminAuditLogs } from "@/hooks/useAdmin";
import { adminAuditApi } from "@/lib/adminApiClient";

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminAuditLogs({ page, pageSize: 50 });
  const rows = data?.data ?? [];

  const exportLogs = async () => {
    try { const r = await adminAuditApi.export(); if (r?.downloadUrl) window.open(r.downloadUrl, "_blank"); } catch { /* toast handled elsewhere */ }
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Audit Logs" description="Immutable platform audit trail." />
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" /> Audit Logs</h1>
          <p className="text-muted-foreground">Immutable platform action trail — who did what, when.</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportLogs}><FileDown className="w-4 h-4 mr-1" /> Export</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle><CardDescription>Page {data?.page ?? page} of {data?.totalPages ?? "?"} · {data?.total ?? 0} entries</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No audit entries.</p>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="grid grid-cols-12 gap-2 px-3 py-1 text-xs text-muted-foreground font-medium">
                <span className="col-span-3">Action</span><span className="col-span-2">Entity</span><span className="col-span-3">Actor</span><span className="col-span-4">When</span>
              </div>
              {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-2 px-3 py-2 rounded bg-secondary/30 items-center">
                  <Badge variant="secondary" className="col-span-3 w-fit">{r.action}</Badge>
                  <span className="col-span-2 truncate text-xs">{r.entityType}{r.entityId ? `:${String(r.entityId).slice(0, 8)}` : ""}</span>
                  <code className="col-span-3 font-mono text-xs truncate">{r.adminId || "system"}</code>
                  <span className="col-span-4 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-4">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {page}</span>
            <Button size="sm" variant="outline" disabled={!data?.hasNext} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
