"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Zap,
  FileWarning,
  Users,
  Building,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAi, type AiStrategy } from "@/hooks/use-ai";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AnalysisResult = AiStrategy['windDown'];

export default function WindDownPlanner() {
  const { strategy } = useAi();
  const { businesses: businessesData } = useDashboardRefs();
  const [business, setBusiness] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!business) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a business to simulate closure.",
      });
      return;
    }
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setResults(strategy.windDown);
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle>Wind-Down Planner</CardTitle>
        <CardDescription>
          Model the financial and operational impact of closing a business unit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Business to Close</Label>
            <Select value={business} onValueChange={setBusiness}>
              <SelectTrigger>
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {businessesData.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex items-end">
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Simulate Closure"
              )}
            </Button>
          </div>
        </div>

        {results && (
          <div className="animate-in fade-in-0 duration-1000">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>AI Simulation: Wind-Down Analysis</CardTitle>
                  <Badge>
                    <Zap className="h-4 w-4 mr-1 text-yellow-400" />
                    {results.confidence}% Confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {results.summary}
                </p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileWarning />
                        Liabilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-500">
                        ${results.outstandingLiabilities}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users />
                        Severance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-500">
                        ${results.employeeSeverance}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Building />
                        Asset Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-500">
                        ${results.assetLiquidationValue}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 border-red-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ShieldAlert />
                        Net Position
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">
                        ${results.netPosition}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
