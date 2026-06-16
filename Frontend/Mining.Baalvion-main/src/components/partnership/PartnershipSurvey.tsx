
"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2 } from "lucide-react";

const surveySchema = z.object({
  material: z.string().min(1, "Please select a material"),
  volume: z.string().min(1, "Please select monthly volume"),
  supply_type: z.string().min(1, "Please select supply type"),
  challenges: z.array(z.string()).min(1, "Please select at least one challenge"),
  budget: z.string().min(1, "Please select a budget range"),
  name: z.string().min(2, "Full name is required"),
  company: z.string().min(2, "Company name is required"),
  email: z.string().email("Invalid business email"),
  phone: z.string().min(5, "Valid phone number is required"),
});

type SurveyValues = z.infer<typeof surveySchema>;

interface PartnershipSurveyProps {
  onSubmit: (data: SurveyValues) => void;
  isSubmitting: boolean;
  submissionStep: number;
}

export function PartnershipSurvey({ onSubmit, isSubmitting, submissionStep }: PartnershipSurveyProps) {
  const form = useForm<SurveyValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      challenges: [],
      material: "",
      volume: "",
      supply_type: "",
      budget: "",
      name: "",
      company: "",
      email: "",
      phone: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        <div className="space-y-8">
          <div className="grid sm:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mineral Interest</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="iron_ore">Iron Ore</SelectItem>
                      <SelectItem value="copper">Copper</SelectItem>
                      <SelectItem value="lithium">Lithium</SelectItem>
                      <SelectItem value="granite">Granite</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Volume (MT)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0-50">&lt; 50 MT</SelectItem>
                      <SelectItem value="50-200">50–200 MT</SelectItem>
                      <SelectItem value="200-500">200–500 MT</SelectItem>
                      <SelectItem value="500+">500+ MT</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sourcing Challenges</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "quality", label: "Grade Consistency" },
                { id: "pricing", label: "Competitive Pricing" },
                { id: "logistics", label: "Delivery Speed" },
                { id: "scaling", label: "Fulfillment Scale" },
              ].map((challenge) => (
                <FormField
                  key={challenge.id}
                  control={form.control}
                  name="challenges"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all cursor-pointer">
                      <FormControl>
                        <Checkbox
                          checked={field.value?.includes(challenge.id)}
                          onCheckedChange={(checked) => {
                            return checked
                              ? field.onChange([...field.value, challenge.id])
                              : field.onChange(field.value?.filter((value) => value !== challenge.id))
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-bold text-slate-700 cursor-pointer">{challenge.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8 pt-8 border-t border-slate-100">
          <div className="grid sm:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</FormLabel>
                  <FormControl><Input className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Business Email</FormLabel>
                  <FormControl><Input className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company</FormLabel>
                  <FormControl><Input className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</FormLabel>
                  <FormControl><Input className="h-12" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button disabled={isSubmitting} className="w-full bg-primary h-16 font-black uppercase italic text-lg rounded-2xl">
          {isSubmitting ? (
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-[9px] font-bold animate-pulse">
                {["Analyzing...", "Mapping...", "Generating...", "Dispatching..."][submissionStep] || "Processing..."}
              </span>
            </div>
          ) : (
            <>Synthesize Strategy Roadmap <ArrowRight className="ml-2 h-6 w-6" /></>
          )}
        </Button>
      </form>
    </Form>
  );
}
