"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, MapPin, ShieldCheck, Loader2, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";

const contactSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid business email"),
  inquiryType: z.string().min(1, "Please select an inquiry type"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  consent: z.boolean().refine((val) => val === true, "You must agree to the privacy policy to submit"),
});

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      inquiryType: "General Support",
      message: "",
      consent: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "contact-page", company_website: "" }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json?.success) {
        toast({
          title: "Inquiry Sent",
          description:
            json.message ??
            "A trade specialist from Baalvion Mining Inc. will contact you shortly.",
        });
        form.reset();
        return;
      }

      // Surface field-level errors back onto the form when present.
      if (json?.fieldErrors && typeof json.fieldErrors === "object") {
        for (const [name, messages] of Object.entries(json.fieldErrors)) {
          const message = Array.isArray(messages) ? messages[0] : undefined;
          if (message) {
            form.setError(name as keyof z.infer<typeof contactSchema>, {
              type: "server",
              message: String(message),
            });
          }
        }
      }

      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          json?.error ??
          "We could not send your inquiry. Please try again or email trade@baalvion.com.",
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
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden">
      <Navbar />
      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 lg:py-20 flex-1">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="space-y-10">
            <div className="space-y-4">
              <Badge className="bg-secondary text-secondary-foreground uppercase font-black tracking-widest text-[10px] px-4 py-1">Global Terminal</Badge>
              <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tight">Connect with <br /> Our Experts</h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-lg">
                Our team at <strong className="font-bold text-slate-700">Baalvion Mining Inc.</strong> is ready to facilitate your bulk industrial and commodity supply chain requirements.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operated By</p>
                    <p className="text-lg font-bold text-slate-900 leading-none mt-1">Baalvion Industries Private Limited</p>
                    <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter">CIN: U43121OD2025PTC048479</p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <Phone className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-sm font-bold text-slate-700">+91 89512 84770</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-3">
                    <Mail className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trade Desk</p>
                      <p className="text-sm font-bold text-slate-700">trade@baalvion.com</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Headquarters</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">Altamount Road, Lodha Altamount, Mumbai, Maharashtra – 400026, India</p>
                  </div>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/5 text-primary rounded-lg shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Office</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">C/o Dilip Kumar Kuldeep, Upper Mania, PO Pakjhola, Semiliguda, Koraput, Odisha – 764036, India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-2xl p-1 rounded-[2.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
            <CardContent className="p-8 md:p-12">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-primary">Inquiry Terminal</h3>
                <p className="text-xs text-slate-500 mt-1">High-priority industrial intake active</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" className="h-12 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" className="h-12 rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
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
                    name="inquiryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Required</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="General Support">General Support</SelectItem>
                            <SelectItem value="Bulk Sourcing">Bulk Sourcing</SelectItem>
                            <SelectItem value="Export Compliance">KYC / Compliance</SelectItem>
                            <SelectItem value="Logistics">Logistics Partnership</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirement Details</FormLabel>
                        <FormControl>
                          <Textarea placeholder="How can Baalvion Mining Inc. assist your global operations?" className="min-h-[140px] rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="grid gap-1.5 leading-none">
                          <FormLabel className="text-[11px] font-medium text-slate-500 leading-relaxed">
                            I agree to allow Baalvion Industries Private Limited to process my trade data as outlined in the <Link href="/privacy" className="text-primary font-bold hover:underline">Privacy Policy</Link>.
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button disabled={isSubmitting} className="w-full bg-primary h-14 font-bold text-lg shadow-xl shadow-primary/20 rounded-2xl">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Secure Inquiry"}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
                    <ShieldCheck className="h-3 w-3 text-secondary" /> Secure Session Active
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
