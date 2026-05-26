
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { format, parseISO } from 'date-fns';
import corporateActionsData from '@/lib/data/corporate-actions.json';

export default function ActiveDealsTable() {
  const deals = corporateActionsData.activeDeals;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Deals</CardTitle>
        <CardDescription>An overview of all ongoing corporate actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value (USD)</TableHead>
                <TableHead>Est. Close</TableHead>
                <TableHead>Owner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.name}</TableCell>
                  <TableCell>{deal.type}</TableCell>
                  <TableCell><Badge variant="secondary">{deal.stage}</Badge></TableCell>
                  <TableCell>{deal.value}</TableCell>
                  <TableCell>{format(parseISO(deal.close), 'MMM yyyy')}</TableCell>
                  <TableCell>{deal.owner}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
