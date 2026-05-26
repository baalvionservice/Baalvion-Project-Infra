import { useState, useMemo, useCallback } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Globe, Smartphone, Server, Copy, Download, RefreshCw, Search, Filter,
  CheckCircle, AlertTriangle, XCircle, Clock, Eye, Loader2,
  FileJson, FileSpreadsheet, FileText, MoreHorizontal, Trash2, RotateCw,
} from "lucide-react";
import { useProxies, useDeleteProxy, useRotateProxy } from "@/hooks/usePlatform";
import { Proxy } from "@/lib/platformClient";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "outline" | "secondary" | "destructive"; icon: typeof CheckCircle }> = {
  healthy: { label: "Active", variant: "outline", icon: CheckCircle },
  degraded: { label: "Degraded", variant: "secondary", icon: AlertTriangle },
  offline: { label: "Offline", variant: "destructive", icon: XCircle },
};

const PAGE_SIZE = 10;

function exportToCSV(proxies: Proxy[], filename: string) {
  const header = "id,name,host,port,country,type,protocol,status,bandwidthUsedGb,successRate,avgLatency\n";
  const rows = proxies.map(p =>
    [p.id, p.name, p.host, p.port, p.country, p.type, p.protocol, p.status, p.bandwidthUsedGb, p.successRate ?? "", p.avgLatency ?? ""].join(",")
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON(proxies: Proxy[], filename: string) {
  const blob = new Blob([JSON.stringify(proxies, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportToTXT(proxies: Proxy[], filename: string) {
  const content = proxies.map(p => `${p.host}:${p.port}`).join("\n");
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ProxyManagement() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: proxyPage, isLoading, isFetching, refetch } = useProxies({ page: currentPage, pageSize: PAGE_SIZE });
  const deleteProxy = useDeleteProxy();
  const rotateProxy = useRotateProxy();

  const proxies = proxyPage?.data ?? [];
  const totalPages = proxyPage?.totalPages ?? 1;

  const countries = useMemo(() => {
    const unique = new Set(proxies.map(p => p.country).filter(Boolean));
    return ["all", ...Array.from(unique).sort()];
  }, [proxies]);

  const filtered = useMemo(() => {
    return proxies.filter(p => {
      if (activeTab !== "all" && p.type !== activeTab) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (countryFilter !== "all" && p.country !== countryFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.host.includes(q) || p.country.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [proxies, activeTab, statusFilter, countryFilter, searchQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery(""); setStatusFilter("all"); setCountryFilter("all"); setActiveTab("all");
  }, []);

  const activeFiltersCount = [activeTab !== "all", statusFilter !== "all", countryFilter !== "all", searchQuery !== ""].filter(Boolean).length;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleViewDetails = (proxy: Proxy) => {
    setSelectedProxy(proxy);
    setDrawerOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteProxy.mutateAsync(confirmDelete);
    setConfirmDelete(null);
  };

  const dateLabel = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <SEOHead title="Proxy Management" description="Configure, manage, and monitor your residential, mobile, and datacenter proxy connections." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proxy Management</h1>
          <p className="text-muted-foreground">Configure and manage your proxy connections.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { exportToCSV(filtered, `proxies-${dateLabel}.csv`); toast({ title: "Exported CSV" }); }}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { exportToJSON(filtered, `proxies-${dateLabel}.json`); toast({ title: "Exported JSON" }); }}>
                <FileJson className="w-4 h-4 mr-2" /> Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { exportToTXT(filtered, `proxies-${dateLabel}.txt`); toast({ title: "Exported TXT" }); }}>
                <FileText className="w-4 h-4 mr-2" /> Export as TXT (Host:Port)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filters */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, host, country..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 bg-secondary/50" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="healthy">Active</SelectItem>
                  <SelectItem value="degraded">Degraded</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[180px] bg-secondary/50"><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  {countries.map(c => (
                    <SelectItem key={c} value={c}>{c === "all" ? "All Countries" : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>Clear ({activeFiltersCount})</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setCurrentPage(1); }}>
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="all">All Types</TabsTrigger>
          <TabsTrigger value="residential" className="gap-2"><Globe className="w-4 h-4" /> Residential</TabsTrigger>
          <TabsTrigger value="mobile" className="gap-2"><Smartphone className="w-4 h-4" /> Mobile</TabsTrigger>
          <TabsTrigger value="datacenter" className="gap-2"><Server className="w-4 h-4" /> Datacenter</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card variant="default">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{activeTab === "all" ? "All" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Proxies</CardTitle>
                <Badge variant="info">{filtered.length} proxies</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
              ) : (
                <div className="space-y-2">
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
                    <div className="col-span-3">Name / Host</div>
                    <div className="col-span-1">Type</div>
                    <div className="col-span-1">Country</div>
                    <div className="col-span-1">Status</div>
                    <div className="col-span-2">Bandwidth</div>
                    <div className="col-span-1">Success</div>
                    <div className="col-span-1">Latency</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No proxies match your filters</p>
                      <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>Clear filters</Button>
                    </div>
                  ) : (
                    filtered.map(proxy => {
                      const s = statusConfig[proxy.status] ?? statusConfig.offline;
                      const StatusIcon = s.icon;
                      const bwPct = proxy.bandwidthLimitGb
                        ? Math.min(100, Math.round((proxy.bandwidthUsedGb / proxy.bandwidthLimitGb) * 100))
                        : 0;

                      return (
                        <div
                          key={proxy.id}
                          className="grid grid-cols-2 lg:grid-cols-12 gap-4 px-4 py-3 text-sm rounded-lg hover:bg-secondary/30 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(proxy)}
                        >
                          <div className="col-span-3 flex flex-col justify-center">
                            <p className="font-medium">{proxy.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{proxy.host}:{proxy.port}</p>
                          </div>
                          <div className="hidden lg:flex col-span-1 items-center">
                            <Badge variant="muted" className="text-xs capitalize">{proxy.type}</Badge>
                          </div>
                          <div className="hidden lg:flex col-span-1 items-center text-sm text-muted-foreground">
                            {proxy.country}
                          </div>
                          <div className="col-span-1 flex items-center">
                            <Badge variant={s.variant} className="gap-1 text-xs">
                              <StatusIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">{s.label}</span>
                            </Badge>
                          </div>
                          <div className="hidden lg:flex col-span-2 items-center gap-2">
                            <div className="w-full">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">{proxy.bandwidthUsedGb.toFixed(2)} GB</span>
                                <span>{bwPct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${bwPct > 90 ? "bg-destructive" : bwPct > 70 ? "bg-warning" : "bg-primary"}`}
                                  style={{ width: `${bwPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="hidden lg:flex col-span-1 items-center">
                            <span className={`font-medium ${(proxy.successRate ?? 99) >= 98 ? "text-success" : (proxy.successRate ?? 99) >= 95 ? "text-warning" : "text-destructive"}`}>
                              {proxy.successRate != null ? `${proxy.successRate}%` : "–"}
                            </span>
                          </div>
                          <div className="hidden lg:flex col-span-1 items-center gap-1 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {proxy.avgLatency != null ? `${proxy.avgLatency}ms` : "–"}
                          </div>
                          <div className="col-span-2 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(proxy)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(`${proxy.host}:${proxy.port}`)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => rotateProxy.mutate(proxy.id)}>
                                  <RotateCw className="w-4 h-4 mr-2" /> Rotate IP
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(proxy.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Connect */}
      <Card variant="glow">
        <CardHeader>
          <CardTitle className="text-lg">Quick Connect</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">HTTP/HTTPS Endpoint</label>
              <div className="flex items-center gap-2">
                <Input value="http://user:pass@proxy.baalvion.net:8080" readOnly className="font-mono text-sm bg-secondary/50" />
                <Button variant="outline" size="icon" onClick={() => handleCopy("http://user:pass@proxy.baalvion.net:8080")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">SOCKS5 Endpoint</label>
              <div className="flex items-center gap-2">
                <Input value="socks5://user:pass@proxy.baalvion.net:1080" readOnly className="font-mono text-sm bg-secondary/50" />
                <Button variant="outline" size="icon" onClick={() => handleCopy("socks5://user:pass@proxy.baalvion.net:1080")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proxy Detail Dialog */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proxy Details</DialogTitle>
          </DialogHeader>
          {selectedProxy && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Name", value: selectedProxy.name },
                  { label: "Host", value: selectedProxy.host },
                  { label: "Port", value: String(selectedProxy.port) },
                  { label: "Protocol", value: selectedProxy.protocol.toUpperCase() },
                  { label: "Type", value: selectedProxy.type },
                  { label: "Country", value: selectedProxy.country },
                  { label: "Status", value: statusConfig[selectedProxy.status]?.label ?? selectedProxy.status },
                  { label: "Bandwidth", value: `${selectedProxy.bandwidthUsedGb.toFixed(2)} GB` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-secondary/30">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-sm mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
              </div>
              {selectedProxy.successRate != null && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="font-medium mt-0.5">{selectedProxy.successRate}%</p>
                </div>
              )}
              {selectedProxy.avgLatency != null && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs text-muted-foreground">Avg Latency</p>
                  <p className="font-medium mt-0.5">{selectedProxy.avgLatency}ms</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => handleCopy(`${selectedProxy.host}:${selectedProxy.port}`)}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Host:Port
                </Button>
                <Button variant="outline" size="icon" onClick={() => rotateProxy.mutate(selectedProxy.id)} disabled={rotateProxy.isPending}>
                  {rotateProxy.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setDrawerOpen(false); setConfirmDelete(selectedProxy.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proxy?</AlertDialogTitle>
            <AlertDialogDescription>This proxy will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete} disabled={deleteProxy.isPending}>
              {deleteProxy.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
