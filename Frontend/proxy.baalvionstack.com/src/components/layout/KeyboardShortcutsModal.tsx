import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open Command Palette" },
  { keys: ["?"], description: "Show Keyboard Shortcuts" },
  { keys: ["R"], description: "Refresh Data" },
  { keys: ["E"], description: "Export" },
  { keys: ["C"], description: "Clear Filters" },
  { keys: ["A"], description: "Toggle Auto Refresh" },
  { keys: ["T"], description: "Toggle Theme" },
  { keys: ["Esc"], description: "Close Dialog / Modal" },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md" aria-describedby="shortcuts-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <p id="shortcuts-desc" className="sr-only">List of keyboard shortcuts available in the application</p>
        <div className="space-y-3 py-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, ki) => (
                  <span key={ki}>
                    <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded min-w-[24px] text-center inline-block">
                      {key}
                    </kbd>
                    {ki < s.keys.length - 1 && <span className="mx-0.5 text-muted-foreground">+</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
