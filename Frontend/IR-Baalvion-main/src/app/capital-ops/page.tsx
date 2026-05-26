"use client";

import { useState, useMemo } from "react";
import { CapOpsRole, Investor, CapitalCall, SPV, ActivityLog } from "@/lib/capital-ops/types";
import { INITIAL_INVESTORS, INITIAL_SPVS } from "@/lib/capital-ops/data";
import { CapitalOverview } from "@/components/capital-ops/CapitalOverview";
import { CapitalCallGenerator } from "@/components/capital-ops/CapitalCallGenerator";
import { InvestorPanel } from "@/components/capital-ops/InvestorPanel";
import { AllocationEngine } from "@/components/capital-ops/AllocationEngine";
import { ActivityLogPanel } from "@/components/capital-ops/ActivityLogPanel";
import { CapitalFlowVisualization } from "@/components/capital-ops/CapitalFlowVisualization";
import { RoleSwitcher } from "@/components/capital-ops/RoleSwitcher";
import { Landmark, ShieldCheck, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function CapitalOperationsPage() {
  // --- STATE ---
  const [role, setRole] = useState<CapOpsRole>('Admin');
  const [investors, setInvestors] = useState<Investor[]>(INITIAL_INVESTORS);
  const [spvs, setSpvs] = useState<SPV[]>(INITIAL_SPVS);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [currentCall, setCurrentCall] = useState<CapitalCall | null>(null);

  // --- DERIVED METRICS ---
  const totalCommitted = useMemo(() => investors.reduce((sum, i) => sum + i.commitmentAmount, 0), [investors]);
  const totalCalled = useMemo(() => investors.reduce((sum, i) => sum + i.calledToDate, 0), [investors]);
  const remainingCommitment = totalCommitted - totalCalled;
  const deployedCapital = useMemo(() => spvs.filter(s => s.id.startsWith('SPV')).reduce((sum, s) => sum + s.allocatedAmount, 0), [spvs]);
  const liquidityReserve = useMemo(() => spvs.find(s => s.id === 'RES-01')?.allocatedAmount || 0, [spvs]);

  const canAllocate = useMemo(() => investors.some(i => i.wireStatus === 'Confirmed' && i.pendingCallAmount > 0), [investors]);

  // --- ACTIONS ---
  const addLog = (message: string, actor: CapOpsRole = role) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(36).substr(2, 9), timestamp, role: actor, message }, ...prev].slice(0, 30));
  };

  const handleGenerateCall = (pct: number) => {
    const callAmount = (totalCommitted * pct) / 100;
    
    setInvestors(prev => prev.map(inv => {
      const invCall = (inv.commitmentAmount * pct) / 100;
      return {
        ...inv,
        pendingCallAmount: invCall,
        wireStatus: 'Not Initiated'
      };
    }));

    addLog(`System issued ${pct}% Capital Call issuance totaling ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(callAmount)}`);
  };

  const handleInitiateWire = (investorId: string) => {
    setInvestors(prev => prev.map(inv => inv.id === investorId ? { ...inv, wireStatus: 'Initiated' } : inv));
    const inv = investors.find(i => i.id === investorId);
    addLog(`${inv?.name} initiated wire transfer for pending call.`, 'Investor');
  };

  const handleConfirmWire = (investorId: string) => {
    setInvestors(prev => prev.map(inv => {
      if (inv.id === investorId) {
        return {
          ...inv,
          wireStatus: 'Confirmed'
        };
      }
      return inv;
    }));
    const inv = investors.find(i => i.id === investorId);
    addLog(`Admin confirmed receipt of funds from ${inv?.name}.`);
  };

  const handleExecuteAllocation = () => {
    // Sum up all confirmed pending funds
    const totalToAllocate = investors.reduce((sum, i) => i.wireStatus === 'Confirmed' ? sum + i.pendingCallAmount : sum, 0);
    
    if (totalToAllocate === 0) return;

    // Distribute to SPVs
    setSpvs(prev => prev.map(spv => ({
      ...spv,
      allocatedAmount: spv.allocatedAmount + (totalToAllocate * spv.targetPercentage) / 100
    })));

    // Settle investors
    setInvestors(prev => prev.map(inv => {
      if (inv.wireStatus === 'Confirmed') {
        return {
          ...inv,
          calledToDate: inv.calledToDate + inv.pendingCallAmount,
          remainingCommitment: inv.remainingCommitment - inv.pendingCallAmount,
          pendingCallAmount: 0,
          wireStatus: 'Not Initiated'
        };
      }
      return inv;
    }));

    addLog(`Strategic Allocation Executed: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalToAllocate)} deployed across portfolio.`);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Main Console Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        
        {/* Header / Toolbar */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 p-4 md:p-8">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Console</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tighter">Capital Operations</h1>
                <p className="text-sm text-muted-foreground mt-1 tracking-tight">Lifecycle management simulation for Baalvion General Partners.</p>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
                <RoleSwitcher currentRole={role} onRoleChange={setRole} />
                <div className="lg:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="p-0 w-80">
                      <SheetHeader className="sr-only">
                        <SheetTitle>Capital Operations Activity Log</SheetTitle>
                      </SheetHeader>
                      <ActivityLogPanel logs={logs} />
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>

            <CapitalOverview 
              totalCommitted={totalCommitted}
              totalCalled={totalCalled}
              remainingCommitment={remainingCommitment}
              deployedCapital={deployedCapital}
              liquidityReserve={liquidityReserve}
            />
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="container mx-auto max-w-6xl space-y-8">
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column: Input & Logic */}
              <div className="space-y-8">
                <CapitalCallGenerator 
                  onGenerate={handleGenerateCall} 
                  disabled={role === 'Investor' || role === 'Board Viewer'} 
                />
                
                <AllocationEngine 
                  spvs={spvs} 
                  onExecute={handleExecuteAllocation} 
                  canExecute={canAllocate}
                  disabled={role === 'Investor' || role === 'Board Viewer'}
                />
              </div>

              {/* Right Column: Visualization */}
              <div className="space-y-8">
                <CapitalFlowVisualization 
                  totalCommitted={totalCommitted}
                  totalCalled={totalCalled}
                  totalDeployed={deployedCapital + liquidityReserve}
                />
                
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl flex gap-4">
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest">Fiduciary Safeguard</p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                      "All capital calls are subject to the Master Partnership Agreement. Allocation logic ensures pro-rata fairness across participating institutional tranches."
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Detailed Registry */}
            <InvestorPanel 
              investors={investors} 
              role={role}
              onInitiateWire={handleInitiateWire}
              onConfirmWire={handleConfirmWire}
            />

          </div>
        </main>
      </div>

      {/* Audit Ledger Sidebar (Desktop Only) */}
      <aside className="hidden lg:block w-80 shrink-0 border-l border-border/50">
        <ActivityLogPanel logs={logs} />
      </aside>
    </div>
  );
}