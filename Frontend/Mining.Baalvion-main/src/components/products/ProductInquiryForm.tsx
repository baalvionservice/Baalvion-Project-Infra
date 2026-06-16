"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

/**
 * Product inquiry / quote-request form. Mirrors the contact page patterns and
 * POSTs to /api/contact with a `product-inquiry:<name>` source tag. The contact
 * API maps these to the trade desk; extra fields are tolerated (zod strips them).
 */
const inquirySchema = z.object({
  name: z.string().min(2, "Your name is required"),
  email: z.string().email("Enter a valid business email"),
  company: z.string().min(2, "Company name is required"),
  quantity: z.string().min(1, "Please indicate the quantity you require"),
  message: z.string().min(10, "Please describe your requirement (min 10 characters)"),
  consent: z.boolean().refine((val) => val === true, "You must agree to the privacy policy to submit"),
});

type InquiryInput = z.infer<typeof inquirySchema>;

export function ProductInquiryForm({ productName }: { productName: string }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      quantity: "",
      message: "",
      consent: false,
    },
  });

  const onSubmit = async (data: InquiryInput) => {
    setIsSubmitting(true);
    try {
      // Map the inquiry fields onto the contact API's expected envelope.
      const [firstName, ...rest] = data.name.trim().split(/\s+/);
      const lastName = rest.join(" ") || firstName;
      const composedMessage = [
        `Product of interest: ${productName}`,
        `Company: ${data.company}`,
        `Quantity required: ${data.quantity}`,
        "",
        "Message:",
        data.message,
      ].join("\n");

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email: data.email,
          inquiryType: "Bulk Sourcing",
          message: composedMessage,
          consent: true,
          source: `product-inquiry:${productName}`,
          company_website: "",
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success) {
        toast({
          title: "Inquiry Sent",
          description:
            json.message ??
            "A sourcing specialist from Baalvion Mining Inc. will contact you shortly.",
        });
        form.reset();
        return;
      }

      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          json?.error ??
          "We could not send your inquiry. Please try again or email procurement@baalvion.com.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Network Error",
        description:
          "We could not reach the server. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" className="h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Industries" className="h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="j.doe@company.com" className="h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity Required</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 500 MT / month" className="h-12 rounded-xl" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirement Details</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Tell us about your requirement for ${productName} — specification, destination, timeline.`}
                  className="min-h-[140px] rounded-xl"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-1">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="grid gap-1.5 leading-none">
                <FormLabel className="text-[11px] font-medium text-slate-500 leading-relaxed">
                  I agree to allow Baalvion Industries Private Limited to process my inquiry data as outlined in the{" "}
                  <Link href="/privacy" className="text-primary font-bold hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          disabled={isSubmitting}
          className="w-full bg-primary h-14 font-bold text-lg shadow-xl shadow-primary/20 rounded-2xl"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="inline-flex items-center gap-2">
              <Send className="h-5 w-5" aria-hidden="true" /> Send Inquiry
            </span>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-2">
          <ShieldCheck className="h-3 w-3 text-secondary" aria-hidden="true" /> Secure Sourcing Intake
        </div>
      </form>
    </Form>
  );
}
