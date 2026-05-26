
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
import equityData from '@/lib/data/equity.json';
import { format } from 'date-fns';

const allHistory = equityData.flatMap(biz => biz.equityHistory);

export default function EquityHistory() {
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
