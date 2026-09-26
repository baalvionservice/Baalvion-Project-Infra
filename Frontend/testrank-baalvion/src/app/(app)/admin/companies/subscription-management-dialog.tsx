"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Company, Plan, Subscription } from "@/lib/types";
import { useRouter } from "next/navigation";

const subscriptionStatuses = [
  "ACTIVE",
  "CANCELED",
  "EXPIRED",
  "TRIAL",
] as const;
const billingCycles = ["MONTHLY", "YEARLY"] as const;

const formSchema = z.object({
  planId: z.string({ required_error: "Please select a plan." }),
  status: z.enum(subscriptionStatuses, {
    required_error: "Please select a status.",
  }),
  billingCycle: z.enum(billingCycles, {
    required_error: "Please select a billing cycle.",
  }),
});

interface SubscriptionManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (subscription: Subscription) => void;
  company: Company | null;
  allPlans: Plan[];
  currentSubscription?: Subscription;
}

export function SubscriptionManagementDialog({
  isOpen,
  onOpenChange,
  onSave,
  company,
  allPlans,
  currentSubscription,
}: SubscriptionManagementDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (currentSubscription) {
      form.reset({
        planId: currentSubscription.planId,
        status: currentSubscription.status,
        billingCycle: currentSubscription.billingCycle,
      });
    } else {
      form.reset({
        planId: allPlans.find((p) => p.name === "Free")?.id || allPlans[0]?.id,
        status: "ACTIVE",
        billingCycle: "MONTHLY",
      });
    }
  }, [currentSubscription, isOpen, form, allPlans]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!company) return;

    const updatedSubscription: Subscription = {
      ...(currentSubscription || {
        id: `sub-comp-${company.id}`,
        companyId: company.id,
        startDate: new Date().toISOString(),
        usage: {
          tasksCreated: 0,
          submissionsReceived: 0,
        },
      }),
      planId: values.planId,
      status: values.status as Subscription["status"],
      billingCycle: values.billingCycle as Subscription["billingCycle"],
      endDate:
        values.billingCycle === "YEARLY"
          ? new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ).toISOString()
          : new Date(
              new Date().setMonth(new Date().getMonth() + 1)
            ).toISOString(),
    };

    toast({
      title: "Subscription Updated",
      description: `${company.name}'s subscription has been updated.`,
    });
    onSave(updatedSubscription);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Manage Subscription: {company?.name}</DialogTitle>
              <DialogDescription>
                Modify the company's subscription plan and status.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} (${plan.priceMonthly}/mo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscription Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subscriptionStatuses.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {billingCycles.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">
                            {c.toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Subscription</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
