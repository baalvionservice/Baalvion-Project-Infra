"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { seedAlerts, type AlertRule } from "@/lib/mock-data";

const conditionTypes = ["Keyword", "Company", "Person", "Country", "Topic", "Sentiment Change"];
const deliveryChannels: AlertRule["delivery"][] = ["Email", "Webhook", "Slack", "Discord"];

export function AlertsView() {
  const [alerts, setAlerts] = useState<AlertRule[]>(seedAlerts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [conditionType, setConditionType] = useState(conditionTypes[0]);
  const [delivery, setDelivery] = useState<AlertRule["delivery"]>("Email");

  function handleCreate() {
    if (label.trim().length === 0) return;
    const newAlert: AlertRule = {
      id: `al-${Date.now()}`,
      label: label.trim(),
      condition: `${conditionType}: ${label.trim()}`,
      delivery,
      active: true,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    setLabel("");
    setConditionType(conditionTypes[0]);
    setDelivery("Email");
    setIsDialogOpen(false);
  }

  function toggleActive(id: string) {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, active: !alert.active } : alert)));
  }

  function removeAlert(id: string) {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{alerts.length} alert rules configured</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" aria-hidden />
              Create alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-condition-type">Condition type</Label>
                <Select value={conditionType} onValueChange={setConditionType}>
                  <SelectTrigger id="alert-condition-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-value">Value</Label>
                <Input
                  id="alert-value"
                  placeholder="e.g. OpenAI"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-delivery">Delivery channel</Label>
                <Select value={delivery} onValueChange={(value) => setDelivery(value as AlertRule["delivery"])}>
                  <SelectTrigger id="alert-delivery">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryChannels.map((channel) => (
                      <SelectItem key={channel} value={channel}>
                        {channel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate}>Create alert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className="glow-card">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{alert.label}</h3>
                <p className="text-xs text-muted-foreground">{alert.condition}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{alert.delivery}</Badge>
                <Badge variant={alert.active ? "positive" : "neutral"}>{alert.active ? "Active" : "Paused"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button variant="outline" size="sm" onClick={() => toggleActive(alert.id)}>
                {alert.active ? "Pause" : "Activate"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeAlert(alert.id)} aria-label={`Delete ${alert.label}`}>
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && <p className="text-sm text-muted-foreground">No alert rules yet.</p>}
      </div>
    </div>
  );
}
