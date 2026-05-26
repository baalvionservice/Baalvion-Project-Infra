import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComplianceRecord } from '@/lib/types';

interface CountryComplianceTableProps {
  complianceData: ComplianceRecord[];
  onSelectRecord: (record: ComplianceRecord) => void;
}

export default function CountryComplianceTable({ complianceData, onSelectRecord }: CountryComplianceTableProps) {

  const getScoreColor = (score: number) => {
    if (score > 90) return 'text-green-600';
    if (score > 80) return 'text-blue-600';
    if (score > 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Country Compliance Details</CardTitle>
        <CardDescription>A breakdown of compliance status for each country of operation.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Tax Status</TableHead>
                <TableHead>Data Laws</TableHead>
                <TableHead>Employment Law</TableHead>
                <TableHead className="text-right">Overall Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complianceData.map((record) => (
                <TableRow key={record.countryId} onClick={() => onSelectRecord(record)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{record.flag}</span>
                      <span>{record.country}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {record.taxStatusCode === 'ok' ? <CheckCircle className="h-4 w-4 text-green-500"/> : <AlertTriangle className="h-4 w-4 text-orange-500" />}
                      <span>{record.taxStatus}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{record.dataLaws}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={record.employmentLaw === 'Compliant' ? 'default' : 'destructive'} 
                           className={record.employmentLaw === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                        {record.employmentLaw}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-bold text-lg", getScoreColor(record.overallScore))}>
                    {record.overallScore}/100
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
