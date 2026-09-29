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

interface CapitalCall {
  id: string;
  callDate: string;
  dueDate: string;
  amount: number;
  status: 'PAID' | 'PENDING';
}

export default function CapitalCalls({ calls }: { calls: CapitalCall[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Capital Calls Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Call Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No capital calls recorded.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="font-medium">{call.id}</TableCell>
                  <TableCell>{call.callDate}</TableCell>
                  <TableCell>{call.dueDate}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(call.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={call.status === 'PAID' ? 'default' : 'destructive'}>
                      {call.status}
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
