"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { getTopicColor } from "@/lib/topic-colors";
import type { Article } from "@/modules/content-engine/types/article";

type Quiz = NonNullable<Article["quiz"]>;

export function ArticleQuiz({ quiz, categoryName }: { quiz?: Quiz; categoryName?: string }) {
  const color = getTopicColor(categoryName);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!quiz?.length) return null;

  const score = quiz.reduce((total, q, i) => (answers[i] === q.correctIndex ? total + 1 : total), 0);

  return (
    <div className="rounded-lg border border-border border-t-4 p-6" style={{ borderTopColor: color }}>
      <p className="mb-5 flex items-center gap-2 text-sm font-bold text-foreground">
        <HelpCircle className="h-4 w-4" style={{ color }} />
        Test what you learned
      </p>

      <div className="space-y-6">
        {quiz.map((q, qi) => (
          <div key={qi}>
            <p className="mb-2 text-sm font-semibold text-foreground">
              {qi + 1}. {q.question}
            </p>
            <div className="space-y-1.5">
              {q.options.map((option, oi) => {
                const isSelected = answers[qi] === oi;
                const isCorrect = oi === q.correctIndex;
                const showState = submitted && (isSelected || isCorrect);
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      showState && isCorrect
                        ? "border-primary bg-primary/10 text-primary"
                        : showState && isSelected
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : isSelected
                            ? "border-primary text-primary"
                            : "border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                    {submitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 shrink-0" />}
                    {option}
                  </button>
                );
              })}
            </div>
            {submitted && q.explanation && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{q.explanation}</p>
            )}
          </div>
        ))}
      </div>

      {submitted ? (
        <p className="mt-6 text-sm font-bold text-foreground">
          You scored {score} of {quiz.length}.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < quiz.length}
          className="mt-6 rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Check answers
        </button>
      )}
    </div>
  );
}
