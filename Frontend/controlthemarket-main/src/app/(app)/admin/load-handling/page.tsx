
import { getSystemMetrics, getServiceLoad, getScalingEvents } from "@/lib/api";
import { LoadHandlingDashboard } from "./load-handling-dashboard";

export default async function LoadHandlingPage() {
  const [
    metrics,
    serviceLoad,
    scalingEvents,
  ] = await Promise.all([
    getSystemMetrics(),
    getServiceLoad(),
    getScalingEvents(),
  ]);

  const latestMetric = metrics[metrics.length - 1];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Load Handling & Scaling
            </h2>
            <p className="text-muted-foreground">
                Monitor system load, traffic distribution, and auto-scaling behavior.
            </p>
        </div>
      </div>
      <LoadHandlingDashboard 
        latestMetric={latestMetric} 
        serviceLoad={serviceLoad} 
        scalingEvents={scalingEvents} 
      />
    </div>
  );
}
