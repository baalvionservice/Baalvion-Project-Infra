
import { getSystemMetrics, getServiceStatus, getSystemIncidents } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Server, Zap, AlertTriangle, Timer, Database, Activity, ShieldCheck, AlertOctagon } from "lucide-react";
import { SystemLoadChart, ApiRequestChart, ApiResponseTimeChart, DatabaseQueryChart } from "./charts";
import { ServiceUptimeList } from "./service-uptime-list";
import { IncidentTimeline } from "./incident-timeline";

export default async function SystemMonitoringPage() {
  const [metrics, services, incidents] = await Promise.all([
    getSystemMetrics(),
    getServiceStatus(),
    getSystemIncidents(),
  ]);

  const latestMetric = metrics[metrics.length - 1];
  const overallUptime = (services.reduce((acc, s) => acc + (s.uptimePercentage || 100), 0) / services.length).toFixed(3);
  const totalDowntimeMinutes = incidents.reduce((acc, i) => acc + (i.durationMinutes || 0), 0);
  const totalIncidents = incidents.length;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            System Health & Monitoring
          </h2>
          <p className="text-muted-foreground">
            A real-time overview of platform performance, uptime, and service health.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Uptime (90d)</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallUptime}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downtime (90d)</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDowntimeMinutes} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents (90d)</CardTitle>
            <AlertOctagon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIncidents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestMetric.errorRate.toFixed(2)}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ServiceUptimeList services={services} />
        <IncidentTimeline incidents={incidents} />
      </div>
      
      <div>
        <h3 className="text-2xl font-bold tracking-tight my-6">
            Live Performance Metrics
        </h3>
        <div className="grid gap-6 lg:grid-cols-2">
          <SystemLoadChart data={metrics} />
          <ApiRequestChart data={metrics} />
          <ApiResponseTimeChart data={metrics} />
          <DatabaseQueryChart data={metrics} />
        </div>
      </div>
    </div>
  );
}
