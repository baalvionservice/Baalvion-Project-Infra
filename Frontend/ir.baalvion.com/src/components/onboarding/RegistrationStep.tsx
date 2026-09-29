"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Full name required"),
  email: z.string().email("Invalid institutional email"),
  investorType: z.enum(["individual", "institutional", "strategic-operator"], {
    message: "Select from the given option",
  }),
  institutionName: z.string().optional(),
});

export function RegistrationStep({ onNext }: { onNext: (data: any) => void }) {
  const [mounted, setMounted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { investorType: "individual" },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const investorType = watch("investorType");

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <CardHeader className="text-center border-b border-border/50 pb-8">
          <div className="h-8 w-48 bg-muted mx-auto rounded mb-2" />
          <div className="h-4 w-64 bg-muted mx-auto rounded" />
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="h-10 bg-muted rounded w-full" />
          <div className="h-12 bg-muted rounded w-full mt-4" />
        </CardContent>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onNext)} suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Institutional Profile
        </CardTitle>
        <CardDescription>
          Establish your corporate identity within the Baalvion registry.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Full Name
            </Label>
            <Input
              {...register("fullName")}
              placeholder="e.g. Elena Petrov"
              className="bg-background/50"
              suppressHydrationWarning
            />
            {errors.fullName && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.fullName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Work Email
            </Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="name@firm.com"
              className="bg-background/50"
              suppressHydrationWarning
            />
            {errors.email && (
              <p className="text-[10px] text-destructive uppercase font-bold">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Investor Classification
          </Label>
          <Select
            defaultValue="individual"
            onValueChange={(v) => setValue("investorType", v as any)}
          >
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">
                Private Individual / Family Office
              </SelectItem>
              <SelectItem value="institutional">
                Institutional / Sovereign Wealth
              </SelectItem>
              <SelectItem value="strategic-operator">
                Strategic Operator
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {investorType === "institutional" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Institution Name
            </Label>
            <Input
              {...register("institutionName")}
              placeholder="e.g. North Atlantic Capital"
              className="bg-background/50"
              suppressHydrationWarning
            />
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-bold uppercase tracking-widest mt-4"
        >
          Establish Identity <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </form>
  );
}
