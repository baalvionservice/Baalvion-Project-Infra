'use client';

import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}

type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };

const toQuiz = (value: Record<string, unknown>): QuizQuestion[] => {
  const raw = value.quiz;
  if (!Array.isArray(raw)) return [];
  return raw.map((q) => {
    const r = q as { question?: unknown; options?: unknown; correctIndex?: unknown; explanation?: unknown };
    const options = Array.isArray(r.options) ? r.options.filter((o): o is string => typeof o === 'string') : [];
    return {
      question: typeof r.question === 'string' ? r.question : '',
      options: options.length ? options : ['', ''],
      correctIndex: typeof r.correctIndex === 'number' ? r.correctIndex : 0,
      explanation: typeof r.explanation === 'string' ? r.explanation : '',
    };
  });
};

/**
 * "Test what you learned" quiz — an array of {question, options, correctIndex,
 * explanation} under `customFields.quiz`, same array-of-objects approach as
 * CitationsPanel. Opt-in per article: the public widget renders nothing when
 * this is empty.
 */
export default function QuizPanel({ value, onChange }: Props) {
  const quiz = toQuiz(value);

  const emit = (next: QuizQuestion[]) => {
    const cleaned = next
      .map((q) => ({ ...q, options: q.options.map((o) => o.trim()).filter(Boolean) }))
      .filter((q) => q.question.trim() && q.options.length >= 2);
    const { quiz: _drop, ...rest } = value;
    onChange(cleaned.length ? { ...rest, quiz: cleaned } : rest);
  };

  const setQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    emit(quiz.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  const addQuestion = () => emit([...quiz, { question: '', options: ['', ''], correctIndex: 0, explanation: '' }]);
  const removeQuestion = (i: number) => emit(quiz.filter((_, idx) => idx !== i));

  const setOption = (qi: number, oi: number, val: string) =>
    setQuestion(qi, { options: quiz[qi].options.map((o, idx) => (idx === oi ? val : o)) });
  const addOption = (qi: number) => quiz[qi].options.length < 6 && setQuestion(qi, { options: [...quiz[qi].options, ''] });
  const removeOption = (qi: number, oi: number) => {
    if (quiz[qi].options.length <= 2) return;
    const nextOptions = quiz[qi].options.filter((_, idx) => idx !== oi);
    const nextCorrect = quiz[qi].correctIndex >= nextOptions.length ? 0 : quiz[qi].correctIndex;
    setQuestion(qi, { options: nextOptions, correctIndex: nextCorrect });
  };

  return (
    <div className="space-y-3 p-4 border-t">
      <div>
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <HelpCircle className="h-3.5 w-3.5" />
          Quiz — &quot;Test what you learned&quot;
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Shown after the article body. Leave empty for no quiz.
        </p>
      </div>

      <div className="space-y-3">
        {quiz.length === 0 && <p className="text-xs text-muted-foreground">No quiz questions yet.</p>}
        {quiz.map((q, qi) => (
          <div key={qi} className="space-y-2 rounded-md border p-2">
            <div className="flex items-center gap-1.5">
              <Input
                className="h-8 flex-1 text-xs"
                placeholder={`Question ${qi + 1}`}
                value={q.question}
                onChange={(e) => setQuestion(qi, { question: e.target.value })}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeQuestion(qi)} title="Remove question">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1 pl-1">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    className="h-3.5 w-3.5 shrink-0"
                    checked={q.correctIndex === oi}
                    onChange={() => setQuestion(qi, { correctIndex: oi })}
                    title="Correct answer"
                  />
                  <Input
                    className="h-7 flex-1 text-xs"
                    placeholder={`Option ${oi + 1}`}
                    value={o}
                    onChange={(e) => setOption(qi, oi, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => removeOption(qi, oi)}
                    disabled={q.options.length <= 2}
                    title="Remove option"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {q.options.length < 6 && (
                <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => addOption(qi)}>
                  <Plus className="mr-1 h-3 w-3" /> Add option
                </Button>
              )}
            </div>

            <Input
              className="h-8 text-xs"
              placeholder="Explanation shown after answering (optional)"
              value={q.explanation}
              onChange={(e) => setQuestion(qi, { explanation: e.target.value })}
            />
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" className="w-full" onClick={addQuestion}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add question
      </Button>
    </div>
  );
}
