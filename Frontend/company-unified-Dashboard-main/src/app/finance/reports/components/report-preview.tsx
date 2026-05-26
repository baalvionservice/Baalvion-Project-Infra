'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Share2, Loader2, CheckCircle } from 'lucide-react';
import type { ReportType } from '../page';
import CreatePortalModal from './share-modal';
import RevenueByBusinessChart from '@/components/charts/revenue-by-business-chart';
import { useToast } from '@/hooks/use-toast';

interface ReportPreviewProps {
  reportType: ReportType;
  onBack: () => void;
}

const reportTitles: Record<ReportType, string> = {
  pnl: 'Monthly P&L Report',
  executive: 'Quarterly Executive Summary',
  annual: 'Annual Financial Statement',
  investor: 'Investor Report',
  tax: 'Tax Summary',
  custom: 'Custom Date Range Report',
};

export default function ReportPreview({ reportType, onBack }: ReportPreviewProps) {
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const { toast } = useToast();

  const handleExport = (type: 'pdf' | 'xlsx') => {
    const setExporting = type === 'pdf' ? setExportingPdf : setExportingXlsx;
    setExporting(true);

    if (type === 'pdf') setPdfReady(false);

    setTimeout(() => {
      setExporting(false);
      if (type === 'pdf') {
          setPdfReady(true);
      } else {
        toast({
            title: 'Download Complete',
            description: `Your XLSX report has been downloaded.`,
        });
      }
    }, 2000);
  };


  return (
    <>
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleExport('pdf')} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 className="mr-2 animate-spin" /> : <Download />}
            {exportingPdf ? 'Exporting PDF...' : pdfReady ? 'PDF Ready' : 'Export PDF'}
            {pdfReady && <CheckCircle className="ml-2" />}
          </Button>
          <Button variant="outline" onClick={() => handleExport('xlsx')} disabled={exportingXlsx}>
            {exportingXlsx ? <Loader2 className="mr-2 animate-spin" /> : <Download />}
            {exportingXlsx ? 'Exporting Excel...' : 'Export Excel'}
          </Button>
          <Button variant="secondary" onClick={() => setShareModalOpen(true)}>
            <Share2 />
            Share
          </Button>
        </div>
      </div>

      <Card className="p-2 sm:p-4 md:p-8 bg-gray-100 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-4xl bg-card text-card-foreground shadow-2xl p-8 aspect-[1/1.414] overflow-y-auto">
          {/* Report Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">Baalvion</h1>
              <div className="text-right">
                <h2 className="text-lg font-semibold">{reportTitles[reportType]}</h2>
                <p className="text-sm text-muted-foreground">For TechCorp India</p>
                <p className="text-sm text-muted-foreground">Period: Q2 2024 (April 1 - June 30)</p>
              </div>
            </div>
            <Separator className="my-4" />
          </header>

          {/* Summary Metrics */}
          <section className="mb-8">
            <h3 className="mb-4 text-xl font-semibold">Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">$2,100,000</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">$450,000</p>
                </CardContent>
              </Card>
              <Card>
                 <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">21.4%</p>
                </CardContent>
              </Card>
              <Card>
                 <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">1,280</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Revenue Table */}
          <section className="mb-8">
            <h3 className="mb-4 text-xl font-semibold">Revenue Breakdown</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow><TableCell>Product A Sales</TableCell><TableCell className="text-right">$1,200,000</TableCell></TableRow>
                  <TableRow><TableCell>Product B Subscriptions</TableCell><TableCell className="text-right">$750,000</TableCell></TableRow>
                  <TableRow><TableCell>Consulting Services</TableCell><TableCell className="text-right">$150,000</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          {/* Chart */}
          <section className="mb-8">
            <h3 className="mb-4 text-xl font-semibold">Revenue by Business Unit</h3>
            <RevenueByBusinessChart />
          </section>
        </div>
      </Card>
      
      <CreatePortalModal isOpen={isShareModalOpen} onOpenChange={setShareModalOpen} />
    </>
  );
}
