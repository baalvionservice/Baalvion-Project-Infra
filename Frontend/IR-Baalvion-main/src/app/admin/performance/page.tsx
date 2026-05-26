"use client";

import { useState, useMemo, useEffect } from "react";
import { UserRole } from "@/core/content/schemas";
import { useAuth } from "@/hooks/useAuth";
import { useNavMetrics } from "@/hooks/useNavMetrics";
import { useCapitalTransactions } from "@/hooks/useCapitalTransactions";
import { useNotifications } from "@/hooks/useNotifications";
import { MetricsSummaryGrid } from "@/components/performance/MetricsSummaryGrid";
import { PerformanceCharts } from "@/components/performance/PerformanceCharts";
import { SpvPerformanceTable } from "@/components/performance/SpvPerformanceTable";
import { DocumentFeed } from "@/components/performance/DocumentFeed";
import { ActivityLogPanel } from "@/components/dataroom/ActivityLogPanel";
import { CapitalCallGenerator } from "@/components/capital-ops/CapitalCallGenerator";
import { AllocationEngine } from "@/components/capital-ops/AllocationEngine";
import { InvestorPanel } from "@/components/capital-ops/InvestorPanel";
import { CapitalFlowVisualization } from "@/components/capital-ops/CapitalFlowVisualization";
import { 
  SPV_PERFORMANCE, 
  CAPITAL_TIMELINE,
  PERFORMANCE_DOCUMENTS 
} from "@/lib/performance/data";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { TrendingUp, ShieldCheck, Download, Activity, RefreshCw, Layers, Wallet, Landmark, Filter, Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Locale, t } from "@/utils/i18n";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Unified Performance Dashboard (Hooks Refactor)
 * Demonstrates the transition to decoupled data-fetching patterns.
 */
export default function PerformanceDashboardPage() {
  const { role, changeRole, isAdmin } = useAuth();
  const { navHistory, metrics, currentNav, isLoading: metricsLoading } = useNavMetrics();
  const { investors, spvs, issueCapitalCall, updateWireStatus } = useCapitalTransactions();
  
  const [locale, setLocale] = useState<Locale>('en');
  const [logs, setLogs] = useState<any[]>([]);
  
  // Advanced Filter State
  const [assetFilter, setAssetFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  
  const { toast } = useToast();

  useEffect(() => {
    const savedLocale = localStorage.getItem('baalvion_locale') as Locale;
    if (savedLocale) setLocale(savedLocale);
  }, []);

  const addLog = (message: string, actorRole: string = role) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), timestamp, role: actorRole, message, action: 'Simulation', documentName: message }, ...prev].slice(0, 30));
  };

  const handleExecuteAllocation = () => {
    const totalToAllocate = investors.reduce((sum, i) => i.wireStatus === 'Confirmed' ? sum + i.pendingCallAmount : sum, 0);
    if (totalToAllocate === 0) {
      toast({ variant: "destructive", title: "Allocation Failed", description: "No confirmed funds available for deployment." });
      return;
    }
    addLog(`Strategic Allocation Executed: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalToAllocate)} deployed.`);
    toast({ title: "Allocation Successful", description: "Capital has been deployed to strategic assets." });
  };

  const filteredSpvs = useMemo(() => {
    if (assetFilter === 'all') return SPV_PERFORMANCE;
    return SPV_PERFORMANCE.filter(s => s.id === assetFilter);
  }, [assetFilter]);

  if (metricsLoading) return <div className="py-40 text-center animate-pulse text-muted-foreground">Synchronizing institutional ledger...</div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="w-full lg:w-auto">
                <div className="flex items-center justify-between lg:justify-start gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Hub</span>
                  </div>
                  {/* Activity Log Trigger for Mobile/Tablet */}
                  <div className="lg:hidden">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Activity className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="p-0 w-80">
                        <SheetHeader className="sr-only">
                          <SheetTitle>Audit Trail</SheetTitle>
                        </SheetHeader>
                        <ActivityLogPanel logs={logs} />
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">{t("dashboard.title", locale)}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle", locale)}</p>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex flex-col gap-1.5 flex-1 lg:min-w-[180px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">Active Persona</span>
                  <Select value={role} onValueChange={(val) => changeRole(val as UserRole)}>
                    <SelectTrigger className="h-10 bg-card border-border/50">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("roles.admin", locale)}</SelectItem>
                      <SelectItem value="phase1">{t("roles.investor", locale)}</SelectItem>
                      <SelectItem value="compliance">{t("roles.compliance", locale)}</SelectItem>
                      <SelectItem value="public">{t("roles.public", locale)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="icon" variant="outline" className="h-10 w-10 mt-5 hidden sm:flex">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mb-8 p-4 bg-card/30 border border-border/50 rounded-xl flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Portfolio Filters:</span>
              </div>
              <Select value={assetFilter} onValueChange={setAssetFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-9 bg-background">
                  <SelectValue placeholder="Filter by SPV" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Consolidated View</SelectItem>
                  {SPV_PERFORMANCE.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {metrics && <MetricsSummaryGrid metrics={metrics} currentNav={currentNav} />}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-20">
          <div className="container mx-auto max-w-7xl space-y-12">
            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="bg-card border border-border/50 mb-8 w-full sm:w-auto overflow-x-auto justify-start">
                <TabsTrigger value="performance" className="flex-1 sm:flex-none px-8 font-bold text-xs uppercase tracking-widest">Performance Analytics</TabsTrigger>
                <TabsTrigger value="operations" className="flex-1 sm:flex-none px-8 font-bold text-xs uppercase tracking-widest">Capital Operations</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-8 animate-in fade-in duration-500">
                <PerformanceCharts navData={navHistory} timelineData={CAPITAL_TIMELINE} />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-2">
                    <SpvPerformanceTable data={filteredSpvs} />
                  </div>
                  <div className="space-y-8">
                    <DocumentFeed documents={PERFORMANCE_DOCUMENTS} currentRole={role} />
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
                      <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-primary" /> Regulatory Snapshot
                      </h3>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-6 italic">
                        "Institutional data represents audited ledger entries as of the last quarterly close."
                      </p>
                      <Button className="w-full text-xs font-bold uppercase tracking-widest h-11" variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export Ledger PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="operations" className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <CapitalCallGenerator onGenerate={issueCapitalCall} disabled={!isAdmin} />
                    <AllocationEngine spvs={spvs} onExecute={handleExecuteAllocation} canExecute={investors.some(i => i.wireStatus === 'Confirmed')} disabled={!isAdmin} />
                  </div>
                  <div className="space-y-8">
                    <CapitalFlowVisualization 
                      totalCommitted={investors.reduce((s, i) => s + i.commitmentAmount, 0)}
                      totalCalled={investors.reduce((s, i) => s + i.calledToDate, 0)}
                      totalDeployed={spvs.reduce((s, i) => s + i.allocatedAmount, 0)}
                    />
                    <InvestorPanel 
                      investors={investors} 
                      role={isAdmin ? 'Admin' : 'Investor'}
                      onInitiateWire={(id) => { updateWireStatus(id, 'Initiated'); addLog(`Investor ${id} initiated wire.`); }}
                      onConfirmWire={(id) => { updateWireStatus(id, 'Confirmed'); addLog(`Confirmed receipt for ${id}.`); }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <aside className="hidden lg:block w-80 shrink-0 border-l border-border/50">
        <ActivityLogPanel logs={logs} />
      </aside>
    </div>
  );
}