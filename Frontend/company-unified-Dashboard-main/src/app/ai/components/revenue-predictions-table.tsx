import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import aiPredictionsData from "@/lib/data/ai-predictions.json";
import businessesData from "@/lib/data/businesses";
import fxRatesData from "@/lib/data/fx-rates.json";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Business, FxRate } from "@/lib/types";

const predictions = aiPredictionsData.revenuePredictions;
const businesses = businessesData as Business[];
const fxRates = fxRatesData as FxRate;

function formatCurrency(amount: number, currency: string) {
  if (currency === "INR") {
    return `${(amount / 100000).toFixed(0)}L`; // Lakhs
  }
  return `${(amount / 1000).toFixed(0)}K`;
}

function calculatePercentage(current: number, future: number) {
  return `+${(((future - current) / current) * 100).toFixed(0)}%`;
}

export default function RevenuePredictionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Predictions</CardTitle>
        <CardDescription>
          AI-powered monthly recurring revenue (MRR) forecasts based on current
          trends and market data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Current MRR</TableHead>
                <TableHead className="text-right">3-Month Forecast</TableHead>
                <TableHead className="text-right">6-Month Forecast</TableHead>
                <TableHead className="text-right">12-Month Forecast</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((pred) => {
                const business = businesses.find(
                  (b) => b.id === pred.businessId
                );
                if (!business) return null;
                const image = PlaceHolderImages.find(
                  (i) => i.id === business.imageId
                );
                const rate = fxRates[business.currency] || 1;

                return (
                  <TableRow key={pred.businessId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {image && <AvatarImage src={image.imageUrl} />}
                          <AvatarFallback>
                            {business.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{business.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div>
                        {business.currency}{" "}
                        {formatCurrency(pred.currentMrr, business.currency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        $
                        {(pred.currentMrr / rate).toLocaleString(undefined, {
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div>
                        {business.currency}{" "}
                        {formatCurrency(
                          pred.forecasts.threeMonth,
                          business.currency
                        )}{" "}
                        <span className="text-green-500 text-xs">
                          (
                          {calculatePercentage(
                            pred.currentMrr,
                            pred.forecasts.threeMonth
                          )}
                          )
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        $
                        {(pred.forecasts.threeMonth / rate).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div>
                        {business.currency}{" "}
                        {formatCurrency(
                          pred.forecasts.sixMonth,
                          business.currency
                        )}{" "}
                        <span className="text-green-500 text-xs">
                          (
                          {calculatePercentage(
                            pred.currentMrr,
                            pred.forecasts.sixMonth
                          )}
                          )
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        $
                        {(pred.forecasts.sixMonth / rate).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <div>
                        {business.currency}{" "}
                        {formatCurrency(
                          pred.forecasts.twelveMonth,
                          business.currency
                        )}{" "}
                        <span className="text-green-500 text-xs">
                          (
                          {calculatePercentage(
                            pred.currentMrr,
                            pred.forecasts.twelveMonth
                          )}
                          )
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        $
                        {(pred.forecasts.twelveMonth / rate).toLocaleString(
                          undefined,
                          { maximumFractionDigits: 0 }
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={pred.confidence > 80 ? "default" : "secondary"}
                        className={
                          pred.confidence > 80
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {pred.confidence}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
