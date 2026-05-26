import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, Key, Layers, Users, Zap, BarChart3, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "baalvion_onboarding_steps";

interface Step { id: string; label: string; icon: typeof Key; path: string; }

const steps: Step[] = [
  { id: "api_key", label: "Create an API Key", icon: Key, path: "/app/api-keys" },
  { id: "preset", label: "Create a Proxy Preset", icon: Layers, path: "/app/presets" },
  { id: "sub_user", label: "Add a Team Member", icon: Users, path: "/app/sub-users" },
  { id: "tester", label: "Run a Proxy Test", icon: Zap, path: "/app/tester" },
  { id: "analytics", label: "View Analytics", icon: BarChart3, path: "/app/analytics" },
];

export function OnboardingChecklist() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY + "_dismissed") === "true");

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(completed)); }, [completed]);

  const toggle = (id: string) => {
    setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const progress = Math.round((completed.length / steps.length) * 100);

  if (dismissed || progress === 100) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />Getting Started
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => { setDismissed(true); localStorage.setItem(STORAGE_KEY + "_dismissed", "true"); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-sm font-medium text-muted-foreground">{progress}%</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map(step => {
          const done = completed.includes(step.id);
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${done ? "opacity-60" : "hover:bg-secondary/30"}`}
              onClick={() => { toggle(step.id); if (!done) navigate(step.path); }}
              role="button"
              aria-label={step.label}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${done ? "bg-accent text-accent-foreground" : "border border-border"}`}>
                {done && <Check className="w-3.5 h-3.5" />}
              </div>
              <step.icon className="w-4 h-4 text-muted-foreground" />
              <span className={`text-sm ${done ? "line-through text-muted-foreground" : "font-medium"}`}>{step.label}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
