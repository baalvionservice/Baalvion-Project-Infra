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
  DollarSign,
  Briefcase,
  Users,
  Scale,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import businessesData from "@/lib/data/businesses";
import strategyData from "@/lib/data/strategy.json";
import { useToast } from "@/hooks/use-toast";

type AnalysisResult = typeof strategyData.merge;

export default function MergePlanner() {
  const [business1, setBusiness1] = useState("");
  const [business2, setBusiness2] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = () => {
    if (!business1 || !business2 || business1 === business2) {
      toast({
        variant: "destructive",
        title: "Invalid Selection",
        description: "Please select two different businesses to merge.",
      });
      return;
    }
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      setResults(strategyData.merge);
      setLoading(false);
    }, 1500);
  };

  return (
    <Card className="bg-muted/30">
      <CardHeader>
        <CardTitle>Merger Planner</CardTitle>
        <CardDescription>
          Simulate the outcome of merging two of your existing businesses.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Business 1</Label>
            <Select value={business1} onValueChange={setBusiness1}>
              <SelectTrigger>
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {businessesData.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                    disabled={b.id === business2}
                  >
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Business 2</Label>
            <Select value={business2} onValueChange={setBusiness2}>
              <SelectTrigger>
                <SelectValue placeholder="Select a business" />
              </SelectTrigger>
              <SelectContent>
                {businessesData.map((b) => (
                  <SelectItem
                    key={b.id}
                    value={b.id}
                    disabled={b.id === business1}
                  >
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
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Simulate Merger"
              )}
            </Button>
          </div>
        </div>

        {results && (
          <div className="animate-in fade-in-0 duration-1000">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>AI Simulation: Merger Outcome</CardTitle>
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
                        <DollarSign />
                        Combined Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${results.combinedRevenue}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Briefcase />
                        Cost Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${results.costSavings}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users />
                        Redundant Headcount
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {results.redundantHeadcount}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Scale />
                        New Entity Value
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        ${results.newEntityValue}
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
