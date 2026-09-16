"use client";

import React, { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import {
  getSubmission,
  getTask,
  getUser,
  getEvaluationBySubmission,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FeedbackForm } from "./feedback-form";
import type {
  Submission,
  Task,
  User as Candidate,
  Evaluation,
} from "@/lib/types";
import { VideoFeedbackPanel } from "./video-feedback-panel";

type SubmissionWithRelations = Submission & {
  task?: Task;
  candidate?: Candidate;
  evaluation?: Evaluation;
};

export default function GiveFeedbackPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [submission, setSubmission] = useState<SubmissionWithRelations | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (submissionId) {
      async function fetchData() {
        const subData = await getSubmission(submissionId);
        if (!subData) {
          notFound();
          return;
        }
        const taskData = await getTask(subData.taskId);
        const candidateData = await getUser(subData.userId);
        const evalData = await getEvaluationBySubmission(subData.id);

        setSubmission({
          ...subData,
          task: taskData,
          candidate: candidateData,
          evaluation: evalData,
        });
        setLoading(false);
      }
      fetchData();
    }
  }, [submissionId]);

  if (loading || !submission) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { task, candidate, evaluation } = submission;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">
            Provide Feedback
          </h2>
          <div className="text-muted-foreground flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={candidate?.profile?.avatarUrl} />
                <AvatarFallback>{candidate?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span>{candidate?.name}</span>
            </div>
            <span>|</span>
            <span>Task: {task?.title}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback Form</CardTitle>
              <CardDescription>
                Provide specific comments for each evaluation criterion. The
                candidate will see this feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evaluation ? (
                <FeedbackForm evaluation={evaluation} />
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <p>
                    An evaluation must be completed before providing detailed
                    feedback.
                  </p>
                  <Button asChild variant="link">
                    <Link href={`/company/submissions/${submission.id}`}>
                      Complete Evaluation
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <VideoFeedbackPanel />
        </div>
      </div>
    </div>
  );
}
