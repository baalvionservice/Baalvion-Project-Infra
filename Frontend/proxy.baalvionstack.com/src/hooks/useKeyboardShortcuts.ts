import { useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[], enabled = true) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
};

export const useProxyManagementShortcuts = ({
  onRefresh,
  onExport,
  onClearFilters,
  onToggleAutoRefresh,
}: {
  onRefresh: () => void;
  onExport: () => void;
  onClearFilters: () => void;
  onToggleAutoRefresh: () => void;
}) => {
  const showShortcutsHelp = useCallback(() => {
    toast({
      title: "Keyboard Shortcuts",
      description: "R: Refresh | E: Export | C: Clear filters | A: Toggle auto-refresh | ?: Show help",
    });
  }, []);

  const shortcuts: ShortcutConfig[] = [
    { key: "r", description: "Refresh data", action: onRefresh },
    { key: "e", description: "Export to CSV", action: onExport },
    { key: "c", description: "Clear all filters", action: onClearFilters },
    { key: "a", description: "Toggle auto-refresh", action: onToggleAutoRefresh },
    { key: "?", shiftKey: true, description: "Show shortcuts help", action: showShortcutsHelp },
  ];

  useKeyboardShortcuts(shortcuts);

  return { showShortcutsHelp, shortcuts };
};
