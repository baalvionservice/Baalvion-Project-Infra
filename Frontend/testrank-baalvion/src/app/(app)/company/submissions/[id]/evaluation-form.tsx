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
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Send } from "lucide-react";
import type { SubmissionWithRelations } from "./page";
import {
  aiSubmissionFeedback,
  type SubmissionFeedbackInput,
} from "@/ai/flows/ai-submission-feedback-flow";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createEvaluation } from "@/lib/write-api";
import { useAuth } from "@/contexts/auth-context";

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
  criteriaScores: z.object(
    allCriteria.reduce((acc, key) => {
      acc[key] = z.coerce.number().min(0).max(10).default(8);
      return acc;
    }, {} as Record<string, z.ZodDefault<z.ZodNumber>>)
  ),
  feedback: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long." }),
});

export function EvaluationForm({
  submission,
}: {
  submission: SubmissionWithRelations;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      criteriaScores: submission.evaluation?.criteriaScores
        ? (submission.evaluation.criteriaScores as any)
        : allCriteria.reduce((acc, key) => ({ ...acc, [key]: 8 }), {}),
      feedback: submission.evaluation?.feedback || "",
    },
  });

  const watchedScores = form.watch("criteriaScores");
  const totalScore = useMemo(() => {
    const scores = Object.values(watchedScores);
    if (scores.length === 0) return 0;
    const average =
      scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return Math.round(average * 10); // Scale to 0-100
  }, [watchedScores]);

  const generateAiFeedback = async () => {
    setIsAiLoading(true);
    try {
      if (!submission.task || !submission.content) {
        throw new Error("Task description or submission content is missing.");
      }

      const submissionContent = submission.content.value.startsWith("http")
        ? `Link submitted: ${submission.content.value}`
        : "File content (mocked)";

      const input: SubmissionFeedbackInput = {
        taskDescription: submission.task.description,
        submissionContent: submissionContent,
        submissionType:
          submission.content.type === "link" ? "link_summary" : "text",
      };

      const result = await aiSubmissionFeedback(input);
      form.setValue("feedback", result.overallFeedback, {
        shouldValidate: true,
      });

      const aiScoreOutOf10 = Math.round(result.overallScore / 10);
      const newScores = allCriteria.reduce((acc, key) => {
        acc[key] = aiScoreOutOf10;
        return acc;
      }, {} as Record<string, number>);

      form.setValue("criteriaScores", newScores, { shouldValidate: true });

      toast({
        title: "AI Feedback Generated",
        description:
          "The form has been populated with AI-suggested feedback and scores.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "AI Error",
        description: "Could not generate AI feedback.",
        variant: "destructive",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to submit an evaluation.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    const finalScore = totalScore;

    await createEvaluation({
      submissionId: submission.id,
      score: finalScore,
      criteriaScores: values.criteriaScores,
      feedback: values.feedback,
      evaluatedBy: user.id,
    });

    toast({
      title: "Evaluation Submitted",
      description: "The candidate has been notified.",
    });
    setIsSubmitting(false);
    router.refresh();
  }

  const SectionSubtotal = ({
    sectionName,
    criteria,
  }: {
    sectionName: string;
    criteria: Record<string, string>;
  }) => {
    const sectionCriteria = Object.keys(criteria);
    const subtotal = useMemo(() => {
      const sectionScores = sectionCriteria.map((c) => watchedScores[c] || 0);
      if (sectionScores.length === 0) return 0;
      const average =
        sectionScores.reduce((sum, score) => sum + score, 0) /
        sectionScores.length;
      return Math.round(average * 10);
    }, [watchedScores, sectionCriteria]);

    return (
      <div className="text-right">
        <p className="font-semibold text-xl">
          {subtotal}
          <span className="text-sm text-muted-foreground">/100</span>
        </p>
        <Progress value={subtotal} className="h-2 mt-1" />
      </div>
    );
  };

  const ScoreCircle = ({ score }: { score: number }) => {
    const circumference = 2 * Math.PI * 30; // 2 * pi * radius
    const offset = circumference - (score / 100) * circumference;

    let colorClass = "text-primary";
    if (score < 50) colorClass = "text-destructive";
    else if (score < 80) colorClass = "text-yellow-500";

    return (
      <div className="relative h-40 w-40 mx-auto">
        <svg className="h-full w-full" viewBox="0 0 80 80">
          <circle
            className="text-muted/20"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="30"
            cx="40"
            cy="40"
          />
          <circle
            className={colorClass}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="30"
            cx="40"
            cy="40"
            transform="rotate(-90 40 40)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">Overall</span>
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Button
          type="button"
          variant="outline"
          onClick={generateAiFeedback}
          disabled={isAiLoading}
        >
          {isAiLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
          )}
          Generate with AI
        </Button>
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary Feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide constructive feedback for the candidate..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(evaluationSections).map(
              ([sectionName, criteria]) => (
                <Card key={sectionName}>
                  <CardHeader className="flex-row items-start justify-between">
                    <CardTitle>{sectionName}</CardTitle>
                    <SectionSubtotal
                      sectionName={sectionName}
                      criteria={criteria}
                    />
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    {Object.entries(criteria).map(
                      ([criterionName, criterionDescription]) => (
                        <FormField
                          key={criterionName}
                          control={form.control}
                          name={`criteriaScores.${criterionName}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex justify-between items-center">
                                <span>{criterionName}</span>
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
                                  onValueChange={(vals) =>
                                    field.onChange(vals[0])
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreCircle score={totalScore} />
              </CardContent>
            </Card>
            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Evaluation
              </Button>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
