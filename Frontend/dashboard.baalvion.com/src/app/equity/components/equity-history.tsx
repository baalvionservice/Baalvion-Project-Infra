'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEquity } from '@/hooks/use-equity';
import { format } from 'date-fns';

interface EquityEvent { id: string; date: string; event: string; stakeholder: string; change: string; newTotal: string }

export default function EquityHistory() {
  const { equity } = useEquity();
  const allHistory = equity.flatMap((biz) => (biz as unknown as { equityHistory?: EquityEvent[] }).equityHistory ?? []);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity History</CardTitle>
        <CardDescription>
          A log of significant equity events across all businesses.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Stakeholder</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>New Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allHistory.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    {format(new Date(event.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{event.event}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{event.stakeholder}</TableCell>
                  <TableCell className="font-mono text-green-600">{event.change}</TableCell>
                  <TableCell className="font-mono">{event.newTotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
