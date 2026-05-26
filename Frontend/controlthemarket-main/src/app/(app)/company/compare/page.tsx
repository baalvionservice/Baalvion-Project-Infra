"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getSubmission,
  getTask,
  getUser,
  getEvaluationBySubmission,
} from "@/lib/api";
import { Loader2 } from "lucide-react";
import { ComparisonView } from "./comparison-view";
import type { Submission, Task, User, Evaluation } from "@/lib/types";

export type ComparisonData = {
  submission: Submission;
  task: Task;
  candidate: User;
  evaluation?: Evaluation;
};

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",");
    if (ids && ids.length > 0) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const submissions = await Promise.all(
            ids.map((id) => getSubmission(id).then((sub) => sub as Submission))
          );

          const detailedData = await Promise.all(
            submissions.filter(Boolean).map(async (submission) => {
              const [task, candidate, evaluation] = await Promise.all([
                getTask(submission.taskId),
                getUser(submission.userId),
                getEvaluationBySubmission(submission.id),
              ]);
              return { submission, task, candidate, evaluation };
            })
          );
          const filteredData = detailedData.filter(
            (d) => !!d.task && !!d.candidate
          ) as ComparisonData[];
          setData(filteredData);
        } catch (error) {
          console.error("Failed to fetch comparison data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <ComparisonView data={data} />;
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}
