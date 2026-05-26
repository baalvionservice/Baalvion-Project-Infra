import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Lightbulb,
  Play,
} from "lucide-react";
import { useEnterprise } from "@/contexts/EnterpriseContext";

interface HelpTooltipProps {
  title: string;
  description: string;
  learnMoreUrl?: string;
}

export function HelpTooltip({ title, description, learnMoreUrl }: HelpTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center w-5 h-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Learn more
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface FeatureExplainerProps {
  title: string;
  description: string;
  tips?: string[];
  icon?: ReactNode;
}

export function FeatureExplainer({ title, description, tips, icon }: FeatureExplainerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          {icon || <Lightbulb className="w-4 h-4 text-primary" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">{title}</h4>
            {tips && tips.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-6 text-xs"
              >
                {expanded ? "Hide tips" : "Show tips"}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          
          <AnimatePresence>
            {expanded && tips && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-border/50"
              >
                <ul className="space-y-2">
                  {tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="muted" className="w-5 h-5 p-0 justify-center text-xs shrink-0">
                        {i + 1}
                      </Badge>
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
}

export function GuidedTour({ steps, onComplete }: GuidedTourProps) {
  const { showTour, setShowTour, tourStep, setTourStep } = useEnterprise();

  if (!showTour) return null;

  const currentStep = steps[tourStep];
  const isFirst = tourStep === 0;
  const isLast = tourStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setShowTour(false);
      setTourStep(0);
      onComplete();
    } else {
      setTourStep(tourStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setTourStep(tourStep - 1);
    }
  };

  const handleSkip = () => {
    setShowTour(false);
    setTourStep(0);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <Card className="shadow-2xl border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <Badge variant="secondary" className="mb-2">
                  Step {tourStep + 1} of {steps.length}
                </Badge>
                <h3 className="font-semibold text-lg">{currentStep.title}</h3>
              </div>
              <Button variant="ghost" size="icon" onClick={handleSkip}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-6">{currentStep.description}</p>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === tourStep ? "bg-primary" : i < tourStep ? "bg-primary/50" : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={isFirst}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button variant="hero" onClick={handleNext}>
                {isLast ? "Complete" : "Next"}
                {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

export function StartTourButton() {
  const { setShowTour, setTourStep } = useEnterprise();

  const handleStart = () => {
    setTourStep(0);
    setShowTour(true);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleStart} className="gap-2">
      <Play className="w-4 h-4" />
      Take a Tour
    </Button>
  );
}

export function InlineHint({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-xs text-muted-foreground">
      <Lightbulb className="w-3 h-3 text-primary" />
      {children}
    </div>
  );
}
