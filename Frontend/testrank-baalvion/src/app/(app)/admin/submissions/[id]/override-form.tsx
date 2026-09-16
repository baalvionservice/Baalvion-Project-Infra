"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import type { SubmissionWithRelations } from "./page";
import { useRouter } from "next/navigation";
import type { SubmissionStatus } from "@/lib/types";

const evaluationSections = {
  "Technical Skills": ["Proficiency", "Best Practices"],
  Communication: ["Clarity", "Documentation"],
  "Problem Solving": ["Analysis", "Solution Quality"],
  Creativity: ["Innovation", "Polish & Initiative"],
  "Cultural Fit": ["Collaboration", "Proactiveness"],
};

const allCriteria = Object.values(evaluationSections).flat();
const allStatuses = [
  "assigned",
  "in-progress",
  "pending",
  "in-review",
  "evaluated",
  "shortlisted",
  "rejected",
  "resubmitted",
  "moved-to-next-round",
  "flagged",
] as const;

const formSchema = z.object({
  criteriaScores: z.object(
    allCriteria.reduce((acc, key) => {
      acc[key] = z.coerce.number().min(0).max(10).default(0);
      return acc;
    }, {} as Record<string, z.ZodDefault<z.ZodNumber>>)
  ),
  feedback: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long." }),
  status: z.enum(allStatuses),
  totalScore: z.coerce.number().min(0).max(100),
});

export function OverrideForm({
  submission,
}: {
  submission: SubmissionWithRelations;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      criteriaScores: submission.evaluation?.criteriaScores
        ? (submission.evaluation.criteriaScores as any)
        : allCriteria.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}),
      feedback: submission.evaluation?.feedback || "No feedback provided.",
      status: submission.status,
      totalScore: submission.evaluation?.score || 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log("Override Submitted:", values);

    setTimeout(() => {
      toast({
        title: "Override Successful",
        description: `The evaluation for ${submission.candidate?.name} has been updated.`,
      });
      setIsSubmitting(false);
      router.push("/admin/submissions");
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Submission Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {allStatuses.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="capitalize"
                      >
                        {status.replace("-", " ")}
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
            name="totalScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overall Score (0-100)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary Feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Admin comments or override reason..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Card>
          <CardHeader>
            <CardTitle>Criteria Scores (0-10)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {allCriteria.map((criterion) => (
              <FormField
                key={criterion}
                control={form.control}
                name={`criteriaScores.${criterion}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex justify-between items-center">
                      <span>{criterion}</span>
                      <span className="font-bold text-primary">
                        {field.value}/10
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Save Override
          </Button>
        </div>
      </form>
    </Form>
  );
}
