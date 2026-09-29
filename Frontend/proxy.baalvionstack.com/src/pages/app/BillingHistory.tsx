import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/SEOHead";
import { FileText, Download, Search, Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/usePlatform";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, "success" | "warning" | "destructive" | "default"> = {
  paid: "success", pending: "warning", failed: "destructive", refunded: "default",
};

export default function BillingHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useInvoices({ page, pageSize: 20 });

  const invoices = (data?.data ?? []).filter(inv => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (search && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleExport = () => {
    if (!invoices.length) return;
    const rows = [
      ["Invoice ID", "Date", "Amount", "Status"],
      ...invoices.map(inv => [
        inv.id,
        format(new Date(inv.issuedAt), "yyyy-MM-dd"),
        `$${((inv.total ?? inv.amount) / 100).toFixed(2)}`,
        inv.status,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Invoice History" description="View and download your invoice history." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoice History</h1>
          <p className="text-muted-foreground">View and download all your invoices.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!invoices.length}>
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search invoice ID..." className="pl-9"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No invoices found.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {invoices.map(inv => (
                  <div key={inv.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="font-mono text-sm font-medium">{inv.id}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(inv.issuedAt), "MMMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">${((inv.total ?? inv.amount) / 100).toFixed(2)}</span>
                      <Badge variant={STATUS_COLORS[inv.status] ?? "default"}>{inv.status}</Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Page {data.page} of {data.totalPages} · {data.total} invoices
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!data.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={!data.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
