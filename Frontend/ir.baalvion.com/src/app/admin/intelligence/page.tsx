
"use client";

import { useState, useEffect } from "react";
import { authService } from "@/core/services/auth.service";
import { UserRole } from "@/core/content/schemas";
import { MOCK_INTELLIGENCE_DATA } from "@/lib/intelligence-data";
import { AlertsPanel } from "@/components/admin/AlertsPanel";
import { ESGDashboard } from "@/components/admin/ESGDashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  ShieldCheck, 
  Activity, 
  Download, 
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function IntelligenceCenterPage() {
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadRole = async () => {
      const { role } = await authService.getCurrentUser();
      setActiveRole(role);
      setIsLoading(false);
    };
    loadRole();
    window.addEventListener('storage', loadRole);
    return () => window.removeEventListener('storage', loadRole);
  }, []);

  const handleRefresh = () => {
    toast({
      title: "Data Re-Sync Initiated",
      description: "Aggregating latest ESG and Alert metrics from the registry.",
    });
  };

  if (isLoading) return <div className="p-20 text-center text-muted-foreground">Initializing Intelligence Core...</div>;

  // Filter alerts based on role visibility
  const filteredAlerts = MOCK_INTELLIGENCE_DATA.alerts.filter(alert => 
    alert.role.includes(activeRole) || activeRole === 'admin'
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-5 w-5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Institutional Hub</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">Governance Intelligence</h1>
          <p className="text-sm text-muted-foreground">Unified monitoring of institutional risk, ESG, and system alerts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Registry
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" /> Export Intelligence Packet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          <Tabs defaultValue="esg" className="w-full">
            <TabsList className="bg-card border border-border/50 mb-6">
              <TabsTrigger value="esg" className="px-8 font-bold text-xs uppercase tracking-widest">ESG Transparency</TabsTrigger>
              <TabsTrigger value="risk" className="px-8 font-bold text-xs uppercase tracking-widest" disabled={activeRole === 'phase1'}>Strategic Risk</TabsTrigger>
            </TabsList>

            <TabsContent value="esg" className="space-y-8">
              <ESGDashboard 
                metrics={MOCK_INTELLIGENCE_DATA.esgMetrics} 
                globalScore={MOCK_INTELLIGENCE_DATA.globalEsgScore} 
              />
              
              <Card className="bg-muted/20 border-dashed border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" /> Fiduciary Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-[11px] text-muted-foreground italic leading-relaxed">
                  "ESG performance represents verified third-party audits as of the trailing twelve months. Sustainability metrics are calculated per the Baalvion ESG Framework v2.1 and are subject to continuous regulatory monitoring."
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk">
              <div className="py-20 text-center border-2 border-dashed rounded-xl">
                <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground">Predictive Risk Modeling is currently restricted to Board-Level clearance.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-8">
          <AlertsPanel alerts={filteredAlerts} />
          
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest">Platform Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold">Stable</span>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>System Uptime</span>
                  <span>99.99%</span>
                </div>
                <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '99.99%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
