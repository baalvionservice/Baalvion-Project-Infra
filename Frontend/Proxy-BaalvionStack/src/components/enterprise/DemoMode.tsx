import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEnterprise } from "@/contexts/EnterpriseContext";
import { useState } from "react";
import {
  Beaker,
  RefreshCw,
  Database,
  Users,
  Activity,
  AlertTriangle,
  Sparkles,
  X,
} from "lucide-react";

export function DemoModeBanner() {
  const { demoMode, toggleDemoMode, resetDemoData } = useEnterprise();
  const [minimized, setMinimized] = useState(false);

  if (!demoMode.enabled) return null;

  if (minimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-16 right-4 z-50"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMinimized(false)}
          className="bg-warning/10 border-warning/30 text-warning hover:bg-warning/20"
        >
          <Beaker className="w-4 h-4 mr-2" />
          Demo Mode
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 backdrop-blur-sm shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
              <Beaker className="w-5 h-5 text-warning" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">Demo Mode Active</h3>
                <Badge variant="secondary" className="text-xs">Enterprise Dataset</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Viewing simulated enterprise data. Changes won't persist.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetDemoData}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setMinimized(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDemoMode}
            className="text-xs"
          >
            Exit Demo Mode
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetDemoData}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset Data
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function DemoModeToggle() {
  const { demoMode, toggleDemoMode } = useEnterprise();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleToggle = () => {
    if (demoMode.enabled) {
      toggleDemoMode();
    } else {
      setConfirmOpen(true);
    }
  };

  const confirmEnable = () => {
    toggleDemoMode();
    setConfirmOpen(false);
  };

  return (
    <>
      <Card variant="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Beaker className="w-5 h-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-base">Demo Mode</CardTitle>
                <CardDescription>
                  Enable enterprise demo dataset for presentations
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={demoMode.enabled}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <Database className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">847 Proxies</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">12 Users</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">85 GB Used</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">3 Alerts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-warning" />
              Enable Demo Mode?
            </DialogTitle>
            <DialogDescription>
              This will load a simulated enterprise dataset to showcase the platform's capabilities. Perfect for sales demos and presentations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <h4 className="font-medium text-sm mb-2">What you'll see:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• High bandwidth usage metrics</li>
                <li>• Multiple active proxies and sub-users</li>
                <li>• Sample alerts and notifications</li>
                <li>• Enterprise-scale analytics</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={confirmEnable}>
              Enable Demo Mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DemoModeQuickStats() {
  const { demoMode, usage } = useEnterprise();

  if (!demoMode.enabled) return null;

  const stats = [
    { label: "Bandwidth", value: `${(usage.bandwidthUsed / 1024).toFixed(1)} GB`, change: "+23%" },
    { label: "Requests", value: "2.4M", change: "+18%" },
    { label: "Success Rate", value: "99.2%", change: "+0.5%" },
    { label: "Avg Latency", value: "45ms", change: "-12ms" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} variant="stats">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <p className="text-xl font-bold">{stat.value}</p>
              <Badge variant="outline" className="text-success text-xs">
                {stat.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
