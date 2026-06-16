"use client";

import { useState, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/lib/api-client";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

export default function AiInsightsCard() {
  const { businesses } = useDashboardRefs();
  const [selectedBusiness, setSelectedBusiness] = useState("");
  useEffect(() => {
    if (!selectedBusiness && businesses.length) setSelectedBusiness(businesses[0].id);
  }, [businesses, selectedBusiness]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  const handleGenerateInsights = async () => {
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const result = await dashboardApi.aiSummary(selectedBusiness);
      if (result?.summary) {
        setSummary(result.summary);
      } else {
        setError("No insights available for this business yet.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate AI insights.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Performance Insights</CardTitle>
        <CardDescription>
          Generate a summary of key trends and anomalies.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={selectedBusiness}
          onValueChange={setSelectedBusiness}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((biz) => (
              <SelectItem key={biz.id} value={biz.id}>
                {biz.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {summary && (
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertTitle>Analysis Complete</AlertTitle>
            <AlertDescription className="text-sm">{summary}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateInsights}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          {loading ? "Analyzing..." : "Generate Insights"}
        </Button>
      </CardFooter>
    </Card>
  );
}
