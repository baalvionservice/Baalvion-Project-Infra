'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePoll, useUpsertPoll, useDeletePoll } from '@/lib/queries/cms-poll.queries';

interface Props {
  contentId: string;
}

/**
 * A poll lives in its own `cms_content_polls` row (not `customFields`), so
 * unlike the other Advanced-tab panels this saves independently with its own
 * button rather than riding the article's main Save/Publish action.
 */
export default function PollPanel({ contentId }: Props) {
  const { data: poll, isLoading } = usePoll(contentId);
  const upsert = useUpsertPoll(contentId);
  const remove = useDeletePoll(contentId);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    if (poll) {
      setQuestion(poll.question);
      setOptions(poll.options.length ? poll.options : ['', '']);
    }
  }, [poll]);

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  const addOption = () => options.length < 6 && setOptions((prev) => [...prev, '']);
  const removeOption = (i: number) => options.length > 2 && setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSave = question.trim().length > 0 && cleanOptions.length >= 2;

  const handleSave = () => upsert.mutate({ question: question.trim(), options: cleanOptions });
  const handleRemove = () => {
    remove.mutate();
    setQuestion('');
    setOptions(['', '']);
  };

  if (isLoading) return null;

  return (
    <div className="space-y-3 p-4 border-t">
      <div>
        <Label className="flex items-center gap-1.5 text-sm font-medium">
          <BarChart3 className="h-3.5 w-3.5" />
          Reader poll
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          One poll per article, shown near the top of the body. Leave blank for no poll.
        </p>
      </div>

      <Input
        className="h-8 text-xs"
        placeholder="Poll question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="space-y-1.5">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              className="h-8 flex-1 text-xs"
              placeholder={`Option ${i + 1}`}
              value={o}
              onChange={(e) => setOption(i, e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => removeOption(i)}
              disabled={options.length <= 2}
              title="Remove option"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {options.length < 6 && (
        <Button variant="outline" size="sm" className="w-full" onClick={addOption}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add option
        </Button>
      )}

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="flex-1" onClick={handleSave} disabled={!canSave || upsert.isPending}>
          {upsert.isPending ? 'Saving…' : poll ? 'Update poll' : 'Save poll'}
        </Button>
        {poll && (
          <Button variant="outline" size="sm" onClick={handleRemove} disabled={remove.isPending}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
