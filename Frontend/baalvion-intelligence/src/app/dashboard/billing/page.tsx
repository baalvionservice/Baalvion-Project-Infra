import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usageSummary } from "@/lib/mock-data";

const invoices = [
  { id: "INV-1042", date: "2026-06-01", amount: "$79.00", status: "Paid" },
  { id: "INV-1031", date: "2026-05-01", amount: "$79.00", status: "Paid" },
  { id: "INV-1020", date: "2026-04-01", amount: "$79.00", status: "Paid" },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="glow-card">
          <CardHeader>
            <h2 className="text-base font-semibold text-foreground">Current plan</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">{usageSummary.planName}</span>
              <Badge variant="positive">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Renews on {usageSummary.renewsOn}</p>
            <Button variant="outline" size="sm">
              Change plan
            </Button>
          </CardContent>
        </Card>

        <Card className="glow-card">
          <CardHeader>
            <h2 className="text-base font-semibold text-foreground">Payment method</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-mono text-sm text-foreground/90">Visa ending in 4242</p>
            <p className="text-sm text-muted-foreground">Expires 08/2029</p>
            <Button variant="outline" size="sm">
              Update payment method
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glow-card">
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Invoices</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant="positive">{invoice.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
