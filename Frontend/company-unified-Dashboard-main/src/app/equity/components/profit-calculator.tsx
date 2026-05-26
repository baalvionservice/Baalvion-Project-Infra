"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign } from "lucide-react";
import businessesData from "@/lib/data/businesses";
import equityData from "@/lib/data/equity.json";
import type { EquityData } from "@/lib/types";

const allEquityData: EquityData[] = equityData;

export default function ProfitCalculator() {
  const [selectedBusinessId, setSelectedBusinessId] = useState(
    allEquityData[0].businessId
  );
  const [profitAmount, setProfitAmount] = useState<number | string>(1000000);

  const selectedBusiness = allEquityData.find(
    (b) => b.businessId === selectedBusinessId
  );
  const businessDetails = businessesData.find(
    (b) => b.id === selectedBusinessId
  );

  const distributions = selectedBusiness?.stakeholders.map((s) => ({
    name: s.name,
    equity: s.equity,
    payout: (Number(profitAmount) || 0) * (s.equity / 100),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit Distribution Calculator</CardTitle>
        <CardDescription>
          Estimate profit payouts for stakeholders based on their equity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Business</Label>
          <Select
            value={selectedBusinessId}
            onValueChange={setSelectedBusinessId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a business" />
            </SelectTrigger>
            <SelectContent>
              {businessesData.map((biz) => (
                <SelectItem key={biz.id} value={biz.id}>
                  {biz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="profit-amount">
            Monthly Profit ({businessDetails?.currency})
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="profit-amount"
              type="number"
              className="pl-8"
              value={profitAmount}
              onChange={(e) => setProfitAmount(Number(e.target.value) || "")}
              placeholder="Enter profit amount"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start p-6 pt-0">
        <h4 className="font-medium mb-2">Calculated Payouts:</h4>
        {distributions && (
          <div className="w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stakeholder</TableHead>
                  <TableHead className="text-right">Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distributions.map((d) => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right font-mono">
                      {businessDetails?.currency}{" "}
                      {d.payout.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
