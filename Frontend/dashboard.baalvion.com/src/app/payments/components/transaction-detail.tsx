"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { FileCheck, FileClock, FileX, Mail, User, Globe } from "lucide-react";
import { format } from "date-fns";

type TransactionWithBusiness = Transaction & { businessName: string };

interface TransactionDetailProps {
  transaction: TransactionWithBusiness | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function TransactionDetail({
  transaction,
  isOpen,
  onOpenChange,
}: TransactionDetailProps) {
  if (!transaction) return null;

  // Business display comes from the transaction's joined businessName (live data has no logo/country).
  const business = { name: transaction.businessName, country: "—" };
  const businessImage = PlaceHolderImages.find((p) => p.id === "business-default");

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>ID: {transaction.id}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {transaction.currency} {transaction.amount.toLocaleString()}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge
                  variant="outline"
                  className={cn(
                    transaction.status === "Success"
                      ? "text-green-600 border-green-300"
                      : transaction.status === "Failed"
                      ? "text-red-600 border-red-300"
                      : "text-yellow-600 border-yellow-300"
                  )}
                >
                  {transaction.status}
                </Badge>
                <span>on {format(new Date(transaction.date), "PPP")}</span>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative border-s border-gray-200 dark:border-gray-700">
                <li className="mb-6 ms-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                  <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                    {format(new Date(transaction.date), "PPpp")}
                  </time>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transaction {transaction.status}
                  </h3>
                </li>
                <li className="mb-6 ms-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                  <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                    {format(
                      new Date(
                        new Date(transaction.date).getTime() - 1000 * 60 * 2
                      ),
                      "PPpp"
                    )}
                  </time>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Processing
                  </h3>
                </li>
                <li className="ms-4">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full mt-1.5 -start-1.5 border border-white dark:border-gray-900 dark:bg-gray-700"></div>
                  <time className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                    {format(
                      new Date(
                        new Date(transaction.date).getTime() - 1000 * 60 * 5
                      ),
                      "PPpp"
                    )}
                  </time>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Transaction Initiated
                  </h3>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{transaction.customer.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{transaction.customer.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  {businessImage && (
                    <AvatarImage src={businessImage.imageUrl} />
                  )}
                  <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{business.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span>{business.country}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gateway</span>
                <span>{transaction.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {transaction.currency} {transaction.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">
                  {transaction.currency} {transaction.fee.toLocaleString()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span className="text-muted-foreground">Net Payout</span>
                <span>
                  {transaction.currency}{" "}
                  {(transaction.amount - transaction.fee).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
