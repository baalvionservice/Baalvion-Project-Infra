
"use client"

import { useState } from "react";
import { getMarketInsights, type GetMarketInsightsOutput } from "@/ai/flows/get-market-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart4, Loader2, Sparkles, TrendingUp, Info, DollarSign, Target } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const marketSchema = z.object({
  mineralType: z.string().min(1, "Mineral type is required"),
  region: z.string().default("global"),
});

export default function MarketIntelligencePage() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<GetMarketInsightsOutput | null>(null);

  const form = useForm<z.infer<typeof marketSchema>>({
    resolver: zodResolver(marketSchema),
    defaultValues: {
      mineralType: "",
      region: "global",
    },
  });

  const onSubmit = async (values: z.infer<typeof marketSchema>) => {
    setLoading(true);
    try {
      const res = await getMarketInsights({
        mineralType: values.mineralType,
        region: values.region,
        timeframe: "next quarter"
      });
      setInsights(res);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Market Intelligence</h1>
        <p className="text-muted-foreground mt-1">Harness AI to analyze global trends and forecast demand.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Analysis Parameters</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="mineralType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mineral Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Copper, Lithium..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="global">Global</SelectItem>
                            <SelectItem value="asia">Asia</SelectItem>
                            <SelectItem value="africa">Africa</SelectItem>
                            <SelectItem value="europe">Europe</SelectItem>
                            <SelectItem value="americas">Americas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate Analysis
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Pro Tip</AlertTitle>
            <AlertDescription className="text-xs">
              Use specific mineral grades (e.g. "62% Fe Iron Ore") for more accurate pricing fluctuations.
            </AlertDescription>
          </Alert>
        </div>

        <div className="lg:col-span-3">
          {!insights ? (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card rounded-xl border-2 border-dashed">
              <div className="bg-muted p-4 rounded-full mb-4">
                <BarChart4 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-primary">No Analysis Generated</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                Select a mineral and region to receive real-time AI-powered market intelligence.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-lg">Summary & Trends</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm font-bold text-primary leading-relaxed">{insights.summary}</p>
                    <p className="text-sm text-muted-foreground">{insights.trends}</p>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-2">
                    <DollarSign className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-lg">Pricing Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{insights.pricingAnalysis}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                <CardHeader className="flex flex-row items-center gap-2">
                  <Target className="h-5 w-5 text-secondary" />
                  <CardTitle className="text-lg">Demand Forecast</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-primary-foreground/80 leading-relaxed">{insights.demandForecast}</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm border-l-4 border-l-secondary">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Actionable Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-primary font-medium">{insights.recommendations}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
