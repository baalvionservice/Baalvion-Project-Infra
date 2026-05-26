
import { getSystemErrors } from "@/lib/api";
import { ErrorList } from "./error-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, TrendingUp, BarChart, Clock } from "lucide-react";
import { ErrorFrequencyChart, ErrorTrendChart } from "./charts";
import type { SystemError } from "@/lib/types";

export default async function ErrorTrackingPage() {
  const errors = await getSystemErrors();

  const criticalErrorsCount = errors.filter(e => e.severity === 'Critical' && e.status === 'Open').length;
  
  const mostFrequentError = errors.reduce((prev, current) => 
    (prev.frequency > current.frequency) ? prev : current
  );
  
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
         <div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">
                Error Tracking
            </h2>
            <p className="text-muted-foreground">
                Monitor, analyze, and manage all system errors.
            </p>
        </div>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Errors (Open)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{criticalErrorsCount}</div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Occurrences</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{errors.reduce((sum, e) => sum + e.frequency, 0)}</div>
            </CardContent>
        </Card>
         <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Frequent Error</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold truncate">{mostFrequentError.type}</div>
                <p className="text-xs text-muted-foreground">{mostFrequentError.frequency} occurrences</p>
            </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
                <CardTitle>Error Feed</CardTitle>
                <CardDescription>
                    A list of all unique system errors.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ErrorList initialData={errors} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <ErrorFrequencyChart errors={errors} />
            <ErrorTrendChart errors={errors} />
        </div>
      </div>
    </div>
  );
}
