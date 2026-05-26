"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Frown } from "lucide-react";
import Link from "next/link";

const plans = [
  { name: "Starter", price: 99, features: ["1 Business", "Up to 5 users"] },
  {
    name: "Pro",
    price: 299,
    features: ["Up to 5 Businesses", "25 users", "AI predictions"],
  },
  {
    name: "Enterprise",
    price: 999,
    features: ["Unlimited businesses", "Unlimited users", "White-label"],
  },
];

export default function TrialExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-4xl text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Frown className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle className="mt-4 text-3xl">
            Your free trial has ended
          </CardTitle>
          <CardDescription>
            To continue using Baalvion, please select a plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <Card className="bg-background">
            <CardHeader>
              <CardTitle className="text-xl">
                Here's what you accomplished:
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">
                  Businesses Added
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">14</p>
                <p className="text-sm text-muted-foreground">
                  Employees Invited
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold">$2.4M</p>
                <p className="text-sm text-muted-foreground">Revenue Tracked</p>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.name} className="text-left">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="pt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Select Plan</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Need more?{" "}
            <Link href="#" className="underline">
              Contact Sales
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
