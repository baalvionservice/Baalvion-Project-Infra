import { useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";

interface UndoOptions {
  description: string;
  duration?: number;
  onUndo: () => void;
}

export function useUndoAction() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback((action: () => void, options: UndoOptions) => {
    const { description, duration = 5000, onUndo } = options;

    // Execute action
    action();

    // Show undo toast
    const { dismiss } = toast({
      title: "Action completed",
      description,
      duration,
      action: (
        <button
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3"
          onClick={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            onUndo();
            dismiss();
            toast({
              title: "Undone",
              description: "Action has been reverted.",
              duration: 2000,
            });
          }}
        >
          Undo
        </button>
      ) as any,
    });

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
    }, duration);
  }, []);

  return { execute };
}
