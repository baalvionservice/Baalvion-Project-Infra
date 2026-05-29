import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEquity } from "@/hooks/use-equity";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import EquityDistributionDonutChart from "@/components/charts/equity-distribution-donut-chart";

export default function EquityAccordion() {
  const { equity: allEquityData } = useEquity();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equity Split by Business</CardTitle>
        <CardDescription>
          Expand each section to see the detailed stakeholder breakdown.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="item-biz_1">
          {allEquityData.map((data) => {
            const businessName = "Company Cap Table";
            const image = PlaceHolderImages.find((i) => i.id === "business-default");

            return (
              <AccordionItem value={`item-${data.businessId}`} key={data.businessId}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {image && <AvatarImage src={image.imageUrl} />}
                      <AvatarFallback>{businessName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-lg">
                      {businessName}
                    </span>
                    <Badge variant="outline">
                      Valuation: ${(data.valuation / 1_000_000).toFixed(0)}M
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 p-2">
                    <div className="xl:col-span-3">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stakeholder</TableHead>
                            <TableHead className="text-right">Equity</TableHead>
                            <TableHead className="text-right">
                              USD Value
                            </TableHead>
                            <TableHead>Vesting</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.stakeholders.map((s) => (
                            <TableRow key={s.name}>
                              <TableCell>
                                <div className="font-medium">{s.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {s.role}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {s.equity.toFixed(2)}%
                              </TableCell>
                              <TableCell className="text-right">
                                ${(s.usdValue / 1_000_000).toFixed(2)}M
                              </TableCell>
                              <TableCell>{s.vestingStatus}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="xl:col-span-2 flex items-center justify-center">
                      <EquityDistributionDonutChart
                        stakeholders={data.stakeholders}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
