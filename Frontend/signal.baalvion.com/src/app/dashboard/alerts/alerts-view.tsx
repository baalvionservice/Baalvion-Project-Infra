"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
import { useAuthedFetch } from "@/lib/auth/use-authed-fetch";
import type { AlertRuleRecord } from "@/lib/types";

const conditionTypes: Array<{ value: AlertRuleRecord["condition_type"]; label: string }> = [
  { value: "keyword", label: "Title contains keyword" },
  { value: "category", label: "Category equals" },
  { value: "country", label: "Country equals" },
  { value: "sentiment", label: "Sentiment equals" },
  { value: "entity", label: "Entity mentioned" },
];

export function AlertsView() {
  const authedFetch = useAuthedFetch();
  const [alerts, setAlerts] = useState<AlertRuleRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [labelInput, setLabelInput] = useState("");
  const [conditionType, setConditionType] = useState(conditionTypes[0].value);
  const [conditionValue, setConditionValue] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const load = useCallback(() => {
    authedFetch<{ items: AlertRuleRecord[] }>("/api/alerts")
      .then((data) => setAlerts(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load alerts"));
  }, [authedFetch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    if (!labelInput.trim() || !conditionValue.trim() || !webhookUrl.trim()) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await authedFetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label: labelInput.trim(), conditionType, conditionValue: conditionValue.trim(), webhookUrl: webhookUrl.trim() }),
      });
      setLabelInput("");
      setConditionValue("");
      setWebhookUrl("");
      setConditionType(conditionTypes[0].value);
      setIsDialogOpen(false);
      load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(alert: AlertRuleRecord) {
    await authedFetch(`/api/alerts/${alert.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ active: !alert.active }),
    }).catch(() => {});
    load();
  }

  async function removeAlert(id: string) {
    await authedFetch(`/api/alerts/${id}`, { method: "DELETE" }).catch(() => {});
    load();
  }

  if (error) return <p className="text-sm text-destructive">{error}</p>;

  if (!alerts) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading your alert rules…
      </p>
    );
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
                <Label htmlFor="alert-label">Label</Label>
                <Input id="alert-label" placeholder="e.g. OpenAI mentions" value={labelInput} onChange={(e) => setLabelInput(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-condition-type">Condition</Label>
                <Select value={conditionType} onValueChange={(v) => setConditionType(v as AlertRuleRecord["condition_type"])}>
                  <SelectTrigger id="alert-condition-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
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
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert-webhook">Webhook URL</Label>
                <Input
                  id="alert-webhook"
                  placeholder="https://your-app.com/webhooks/baalvion"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  We POST a signed payload here every time a matching article is ingested. Slack
                  and Discord incoming-webhook URLs work too.
                </p>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isSaving}>
                {isSaving ? "Creating…" : "Create alert"}
              </Button>
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
                <p className="text-xs text-muted-foreground">
                  {alert.condition_type}: {alert.condition_value} &middot; triggered {alert.trigger_count}x
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Webhook</Badge>
                <Badge variant={alert.active ? "positive" : "neutral"}>{alert.active ? "Active" : "Paused"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-2 pt-0">
              <Button variant="outline" size="sm" onClick={() => toggleActive(alert)}>
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
