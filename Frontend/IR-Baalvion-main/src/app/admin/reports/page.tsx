"use client";

import { useEffect, useState } from "react";
import { reportingService } from "@/core/services/reporting.service";
import { Report, ReportType, ExportFormat } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileBarChart, Download, Plus, Clock, ShieldCheck, Database, RefreshCw, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReportsManagerPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  // Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReportType>("Governance");

  const loadReports = async () => {
    setIsLoading(true);
    const data = await reportingService.getAllReports();
    setReports(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadReports();
    window.addEventListener('report-updated', loadReports);
    return () => window.removeEventListener('report-updated', loadReports);
  }, []);

  const handleCreate = async () => {
    if (!title) return;
    try {
      await reportingService.createReport({
        title,
        reportType: type,
        dateRange: { start: '2026-01-01', end: '2026-03-31' },
        includedModules: ['Governance', 'Voting'],
        generatedByRole: 'admin'
      });
      toast({ title: "Report Configuration Saved", description: "You can now generate the data snapshot." });
      setIsCreateOpen(false);
      setTitle("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  const handleGenerate = async (id: string) => {
    toast({ title: "Aggregating Data", description: "Generating an immutable snapshot of platform activity..." });
    await reportingService.generateReport(id);
    toast({ title: "Report Generated", description: "The snapshot is now frozen and ready for export." });
  };

  const handleExport = async (id: string, format: ExportFormat) => {
    try {
      await reportingService.exportReport(id, format);
      toast({ title: "Export Successful", description: `Report downloaded as ${format}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Export Failed", description: e.message });
    }
  };

  const handleArchive = async (id: string) => {
    await reportingService.archiveReport(id);
    toast({ title: "Report Archived" });
  };

  if (isLoading) return <div className="py-20 text-center text-muted-foreground">Accessing historical ledgers...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regulatory Reporting</h1>
          <p className="text-muted-foreground">Generate institutional-grade snapshots for compliance and disclosures.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Report</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure Regulatory Report</DialogTitle>
              <DialogDescription>Define the scope and template for the data aggregation.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Report Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q1 2026 Voting Audit" />
              </div>
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={type} onValueChange={(val) => setType(val as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Governance">Governance Activity (Audit Logs)</SelectItem>
                    <SelectItem value="Voting">Voting Summary (Participation & Quorum)</SelectItem>
                    <SelectItem value="DataRoom">Data Room Access & Compliance</SelectItem>
                    <SelectItem value="System">Full System Health Snapshot</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Save Draft</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Title / Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Snapshot Date</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileBarChart className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold">{report.title}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{report.reportType}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'Generated' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : 'Pending'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {report.includedModules.map(mod => (
                        <Badge key={mod} variant="outline" className="text-[8px] px-1">{mod}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {report.status === 'Draft' && (
                        <Button size="sm" variant="outline" onClick={() => handleGenerate(report.id)}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Generate
                        </Button>
                      )}
                      {report.status === 'Generated' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleExport(report.id, 'JSON')}>
                            <Download className="h-3 w-3 mr-1" /> Export JSON
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleArchive(report.id)}>
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-muted/20 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Compliance Lock
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Once a report is <strong>Generated</strong>, the data snapshot is frozen. Subsequent changes to platform content (pages, votes, or logs) will not alter the contents of historical reports. This ensures an immutable record for regulatory audits.
          </CardContent>
        </Card>
        <Card className="bg-muted/20 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" /> Regulatory Packet Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Need to package multiple reports for a board meeting or SEC filing? Use the Packet Builder to bundle reports, material briefcases, and voting results into a single encrypted JSON distribution.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
