"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowUp,
  ThumbsDown,
  ThumbsUp,
  Goal,
  Briefcase,
  Download,
  Share2,
  Loader2,
  CheckCircle,
} from "lucide-react";

import businessesData from "@/lib/data/businesses";
import equityData from "@/lib/data/equity.json";
import { format } from "date-fns";
import CreatePortalModal from "@/app/finance/reports/components/share-modal";
import { useToast } from "@/hooks/use-toast";

interface InvestorUpdatePreviewProps {
  onBack: () => void;
}

export default function InvestorUpdatePreview({
  onBack,
}: InvestorUpdatePreviewProps) {
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const { toast } = useToast();

  const businessPerformance = businessesData.map((biz) => ({
    name: biz.name,
    revenue: biz.currentMetrics.revenue,
    profit: biz.currentMetrics.profit,
    currency: biz.currency,
    status: biz.status,
  }));

  const investors = equityData[3].stakeholders.filter((s) =>
    s.role.includes("Investor")
  );
  const valuation = equityData[3].valuation;

  const handleExportPdf = () => {
    setExportingPdf(true);
    setPdfReady(false);
    setTimeout(() => {
      setExportingPdf(false);
      setPdfReady(true);
      toast({
        title: "PDF Ready",
        description: "Your investor update is ready for download.",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Download />
            )}
            {exportingPdf
              ? "Generating PDF..."
              : pdfReady
              ? "PDF Ready"
              : "Download PDF"}
            {pdfReady && <CheckCircle className="ml-2" />}
          </Button>
          <Button variant="secondary" onClick={() => setShareModalOpen(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      <Card className="p-4 sm:p-6 md:p-8 bg-gray-100 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-4xl bg-card text-card-foreground shadow-2xl p-8 aspect-[1/1.414] overflow-y-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-3xl font-bold text-primary">
                Baalvion Portfolio
              </h1>
              <div className="text-right">
                <h2 className="text-xl font-semibold">Investor Update</h2>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(), "MMMM yyyy")}
                </p>
              </div>
            </div>
            <Separator className="my-4" />
          </header>

          {/* Key Metrics */}
          <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Total Portfolio Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tracking-tight">$150M</p>
                <p className="flex items-center text-green-600">
                  <ArrowUp className="h-4 w-4 mr-1" /> $12M (8.7%) this quarter
                </p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base font-medium text-muted-foreground">
                  Portfolio Revenue (Annualized)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold tracking-tight">$60.2M</p>
                <p className="text-muted-foreground">
                  Across {businessesData.length} businesses
                </p>
              </CardContent>
            </Card>
          </section>

          {/* Highlights */}
          <section className="mb-8">
            <h3 className="mb-4 text-xl font-semibold tracking-tight">
              Quarterly Highlights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex-row items-center gap-4">
                  <ThumbsUp className="w-8 h-8 text-green-500" />
                  <CardTitle>Top Win</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    FinanceHub USA secured Series A funding, increasing
                    valuation by 40%.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center gap-4">
                  <ThumbsDown className="w-8 h-8 text-red-500" />
                  <CardTitle>Biggest Challenge</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    RetailChain UAE is facing increased competition, impacting
                    profit margins.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex-row items-center gap-4">
                  <Goal className="w-8 h-8 text-blue-500" />
                  <CardTitle>Next Quarter Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Driving user acquisition for TechCorp India's new SaaS
                    product.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Business Performance */}
          <section className="mb-8">
            <h3 className="mb-4 text-xl font-semibold tracking-tight">
              Business Performance
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      Revenue (Annualized)
                    </TableHead>
                    <TableHead className="text-right">
                      Profit (Annualized)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessPerformance.map((biz) => (
                    <TableRow key={biz.name}>
                      <TableCell className="font-medium">{biz.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{biz.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {biz.currency} {(biz.revenue / 1_000_000).toFixed(1)}M
                      </TableCell>
                      <TableCell className="text-right">
                        {biz.currency} {(biz.profit / 1_000_000).toFixed(1)}M
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Equity Summary */}
          <section className="mb-8">
            <h3 className="mb-4 text-xl font-semibold tracking-tight">
              Investor Equity Summary (FinanceHub USA)
            </h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Investor</TableHead>
                    <TableHead className="text-right">Equity %</TableHead>
                    <TableHead className="text-right">USD Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investors.map((inv) => (
                    <TableRow key={inv.name}>
                      <TableCell className="font-medium">{inv.name}</TableCell>
                      <TableCell className="text-right">
                        {inv.equity.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        ${((inv.equity / 100) * valuation).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Appendix */}
          <section>
            <h3 className="mb-4 text-xl font-semibold tracking-tight">
              Appendix: Key Metrics
            </h3>
            <div className="rounded-md border p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Total Employees:</span>{" "}
                  <span className="font-medium">284</span>
                </li>
                <li className="flex justify-between">
                  <span>Customer Acquisition Cost (CAC):</span>{" "}
                  <span className="font-medium">$112</span>
                </li>
                <li className="flex justify-between">
                  <span>Lifetime Value (LTV):</span>{" "}
                  <span className="font-medium">$480</span>
                </li>
                <li className="flex justify-between">
                  <span>Monthly Churn Rate:</span>{" "}
                  <span className="font-medium">2.1%</span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      </Card>
      <CreatePortalModal
        isOpen={isShareModalOpen}
        onOpenChange={setShareModalOpen}
      />
    </div>
  );
}
