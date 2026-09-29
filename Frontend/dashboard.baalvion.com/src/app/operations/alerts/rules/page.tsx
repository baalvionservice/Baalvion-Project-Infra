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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';

const mockRules = [
  {
    id: 'rule_1',
    metric: 'Revenue vs Target',
    condition: 'is below',
    value: '80%',
    for: '1 day',
    severity: 'Critical',
    active: true,
  },
  {
    id: 'rule_2',
    metric: 'Server Response Time',
    condition: 'is above',
    value: '500ms',
    for: '15 minutes',
    severity: 'Warning',
    active: true,
  },
  {
    id: 'rule_3',
    metric: 'Failed Transactions',
    condition: 'is more than',
    value: '10',
    for: '1 hour',
    severity: 'Warning',
    active: false,
  },
  {
    id: 'rule_4',
    metric: 'New Client Onboarded',
    condition: 'happens',
    value: '',
    for: '',
    severity: 'Info',
    active: true,
  },
];

export default function AlertRulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alert Rules</h1>
        <p className="text-muted-foreground">
          Define and manage the conditions that trigger alerts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Rules</CardTitle>
          <CardDescription>
            Create custom rules to stay on top of your most important metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.metric}</TableCell>
                    <TableCell>{rule.condition}</TableCell>
                    <TableCell>{rule.value}</TableCell>
                    <TableCell>{rule.for}</TableCell>
                    <TableCell>{rule.severity}</TableCell>
                    <TableCell>
                      <Switch defaultChecked={rule.active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" aria-label="Delete rule">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 flex justify-end">
            <Button>Add New Rule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
