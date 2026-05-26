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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Send, Star } from "lucide-react";
import type { Evaluation } from "@/lib/types";
import { useRouter } from "next/navigation";

const evaluationSections = {
  "Technical Skills": {
    Proficiency: "Demonstrates mastery of required technologies and tools.",
    "Best Practices":
      "Adheres to coding standards, patterns, and best practices.",
  },
  Communication: {
    Clarity: "Clearly explains their thought process, ideas, and solutions.",
    Documentation:
      "Quality and clarity of comments, documentation, and explanations provided.",
  },
  "Problem Solving": {
    Analysis: "Effectively breaks down complex problems into manageable parts.",
    "Solution Quality":
      "Provides a robust, efficient, and well-reasoned solution.",
  },
  Creativity: {
    Innovation:
      "Demonstrates original thinking and innovative approaches to the problem.",
    "Polish & Initiative":
      "The submission is well-polished and shows initiative beyond the basic requirements.",
  },
  "Cultural Fit": {
    Collaboration:
      "Shows potential for being a collaborative and positive team member.",
    Proactiveness:
      "Demonstrates a proactive attitude and a willingness to learn.",
  },
};

const allCriteria = Object.values(evaluationSections).flatMap((section) =>
  Object.keys(section)
);

const formSchema = z.object({
  criteriaComments: z.object(
    allCriteria.reduce((acc, key) => {
      acc[key] = z.string().min(1, { message: "Comment is required." });
      return acc;
    }, {} as Record<string, z.ZodString>)
  ),
  summaryFeedback: z
    .string()
    .min(10, {
      message: "Summary feedback must be at least 10 characters long.",
    }),
});

export function FeedbackForm({ evaluation }: { evaluation: Evaluation }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      criteriaComments:
        evaluation.criteriaComments ||
        allCriteria.reduce((acc, key) => ({ ...acc, [key]: "" }), {}),
      summaryFeedback: evaluation.feedback || "",
    },
  });

  const scores = evaluation.criteriaScores || {};

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log("Feedback Submitted:", values);

    // Mock API call
    setTimeout(() => {
      toast({
        title: "Feedback Submitted",
        description: "The candidate has been notified.",
      });
      setIsSubmitting(false);
      router.push("/company/feedback");
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(evaluationSections).map(([sectionName, criteria]) => (
            <Card key={sectionName}>
              <CardHeader>
                <CardTitle>{sectionName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                {Object.entries(criteria).map(([criterionName]) => {
                  const score = scores[criterionName] || 0;
                  return (
                    <FormField
                      key={criterionName}
                      control={form.control}
                      name={`criteriaComments.${criterionName}`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-1">
                            <FormLabel>{criterionName}</FormLabel>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-primary">
                                {score}/10
                              </span>
                              <Progress
                                value={score * 10}
                                className="w-20 h-2"
                              />
                            </div>
                          </div>
                          <FormControl>
                            <Textarea
                              placeholder={`Feedback for ${criterionName}...`}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Summary Feedback</span>
              <div className="flex items-center gap-2 text-xl font-bold text-primary">
                <Star className="h-5 w-5" />
                <span>Overall Score: {evaluation.score}/100</span>
              </div>
            </CardTitle>
            <CardDescription>
              Provide a final summary of your feedback for the candidate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="summaryFeedback"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Provide constructive, high-level feedback for the candidate..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" disabled={isSubmitting}>
            Save as Draft
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Feedback
          </Button>
        </div>
      </form>
    </Form>
  );
}
