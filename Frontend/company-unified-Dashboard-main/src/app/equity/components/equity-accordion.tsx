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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import businessesData from "@/lib/data/businesses";
import equityData from "@/lib/data/equity.json";
import type { EquityData } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import EquityDistributionDonutChart from "@/components/charts/equity-distribution-donut-chart";

const allEquityData: EquityData[] = equityData;

export default function EquityAccordion() {
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
            const business = businessesData.find(
              (b) => b.id === data.businessId
            );
            if (!business) return null;
            const image = PlaceHolderImages.find(
              (i) => i.id === business.imageId
            );

            return (
              <AccordionItem value={`item-${business.id}`} key={business.id}>
                <AccordionTrigger>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {image && <AvatarImage src={image.imageUrl} />}
                      <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-lg">
                      {business.name}
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
