'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Distribution {
  id: string;
  date: string;
  type: 'INCOME' | 'RETURN_OF_CAPITAL';
  amount: number;
  wireStatus: 'PROCESSED' | 'IN_PROGRESS';
}

export default function DistributionLedger({ distributions }: { distributions: Distribution[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribution Ledger</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Wire Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distributions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No distributions recorded.
                </TableCell>
              </TableRow>
            ) : (
              distributions.map((dist) => (
                <TableRow key={dist.id}>
                  <TableCell className="font-medium">{dist.date}</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      {dist.type.replace(/_/g, ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(dist.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={dist.wireStatus === 'PROCESSED' ? 'outline' : 'secondary'}>
                      {dist.wireStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
