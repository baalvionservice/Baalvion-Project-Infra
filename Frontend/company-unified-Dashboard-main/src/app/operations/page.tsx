
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, UserCheck, BarChart, FileCheck, AlertCircle } from 'lucide-react';
import operationsData from '@/lib/data/operations.json';
import OperationsTable from './components/operations-table';
import ActivityFeed from './components/activity-feed';
import HourlyRevenueChart from '@/components/charts/hourly-revenue-chart';
import { cn } from '@/lib/utils';

export default function OperationsPage() {
  const { snapshot, hourlyRevenue } = operationsData;

  const summaryCards = [
    { title: "Today's Revenue", value: `$${snapshot.todaysRevenue.toLocaleString()}`, change: `+${snapshot.revenueChange}% vs yesterday`, icon: BarChart },
    { title: "Orders Placed", value: snapshot.ordersPlaced, icon: FileCheck },
    { title: "Active Employees", value: `${snapshot.activeEmployees} / ${snapshot.totalEmployees}`, icon: UserCheck },
    { title: "Open Support Tickets", value: snapshot.openSupportTickets, icon: AlertCircle },
    { title: "Pending Approvals", value: snapshot.pendingApprovals, icon: AlertCircle, isAlert: true },
  ];

  return (
    <div className="space-y-8">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Daily Operations</h1>
        <p className="text-muted-foreground">
          A real-time snapshot of your entire business operation for today.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className={cn("h-4 w-4 text-muted-foreground", card.isAlert && card.value > 0 && "text-red-500")} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.change && <p className="text-xs text-green-500 flex items-center"><ArrowUp className="h-3 w-3 mr-1" />{card.change}</p>}
              {card.isAlert && card.value > 0 && <Badge variant="destructive" className="mt-1">Action Required</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <OperationsTable />
            <HourlyRevenueChart data={hourlyRevenue} />
        </div>
        <div className="lg:col-span-1">
            <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
