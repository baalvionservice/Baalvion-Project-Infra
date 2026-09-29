'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/lib/api-client';

interface Report { id: string; name: string; type: string; period: string; generated: string; size: string }

export default function RecentReports() {
  const [reportsData, setReportsData] = useState<Report[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.financeReports();
        const arr = (Array.isArray(d) ? d : (d as { data?: unknown[] })?.data ?? []) as Report[];
        if (!cancelled) setReportsData(arr);
      } catch { /* leave empty */ }
    })();
    return () => { cancelled = true; };
  }, []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
        <CardDescription>Previously generated reports are available for download.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportsData.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>{report.generated}</TableCell>
                  <TableCell>{report.size}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
