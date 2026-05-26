
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FileDown, 
  Calendar as CalendarIcon, 
  Filter, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Download,
  Loader2,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentReports] = useState([
    { id: "REP-2024-001", name: "Q1 Export Tax Audit", type: "Financial", date: "2024-05-15", format: "PDF", status: "COMPLETED" },
    { id: "REP-2024-005", name: "Monthly Logistics Efficiency", type: "Logistics", date: "2024-05-10", format: "CSV", status: "COMPLETED" },
    { id: "REP-2024-008", name: "Annual Production Forecast", type: "Strategy", date: "2024-05-01", format: "XLSX", status: "COMPLETED" },
  ]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Reports & Business Intelligence</h1>
          <p className="text-muted-foreground mt-1">Compile and export high-density trade data for audits and strategy.</p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="px-4 py-2 border-primary text-primary font-bold bg-primary/5">
            <TrendingUp className="h-4 w-4 mr-2" /> Data Refreshed: 12m ago
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-secondary" />
                Report Generator
              </CardTitle>
              <CardDescription>Configure your custom data export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Report Category</Label>
                <Select defaultValue="sales">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales & Revenue</SelectItem>
                    <SelectItem value="logistics">Logistics & Transit</SelectItem>
                    <SelectItem value="compliance">Compliance & Audits</SelectItem>
                    <SelectItem value="inventory">Inventory Valuation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['PDF', 'CSV', 'XLSX'].map((f) => (
                    <Button key={f} variant="outline" size="sm" className="font-bold border-slate-200">
                      {f}
                    </Button>
                  ))}
                </div>
              </div>

              <Button 
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2 h-12 font-bold shadow-lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Compiling Data...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    Generate Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="bg-muted/50 p-1 mb-6">
              <TabsTrigger value="available" className="px-8">Available Templates</TabsTrigger>
              <TabsTrigger value="history" className="px-8">Export History</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { title: "Monthly Tax Audit", desc: "Export all trade invoices and VAT records for the current period.", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
                  { title: "Material Purity Report", desc: "Aggregate lab reports and quality grades across all mine sites.", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { title: "Logistics Latency", desc: "Analyze average transit times vs. carrier estimates.", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                  { title: "Equity & Valuation", desc: "Current value of stored mineral inventory based on spot prices.", icon: PieChart, color: "text-primary", bg: "bg-primary/5" },
                ].map((t, i) => (
                  <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                    <CardContent className="p-6">
                      <div className={cn("p-3 rounded-xl w-fit mb-4", t.bg, t.color)}>
                        <t.icon className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors">{t.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{t.desc}</p>
                      <div className="mt-6 pt-4 border-t flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        <span>Ready to run</span>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {recentReports.map((report) => (
                      <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{report.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold">{report.type}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[10px] text-muted-foreground">{report.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-200">{report.format}</Badge>
                          <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute right-0 top-0 p-8 opacity-10">
              <TrendingUp className="h-48 w-48" />
            </div>
            <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="space-y-4 flex-1">
                <h3 className="text-2xl font-bold">Predictive Intelligence</h3>
                <p className="text-primary-foreground/80 leading-relaxed max-w-xl">
                  Enable AI-powered forecasting to predict price fluctuations and demand shifts before they happen. Our predictive reports use global mineral trade historical data.
                </p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 text-secondary" /> Demand Heatmaps
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 text-secondary" /> Risk Scoring
                  </div>
                </div>
              </div>
              <Button variant="secondary" className="px-8 font-bold shadow-lg">Activate AI Strategy</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
