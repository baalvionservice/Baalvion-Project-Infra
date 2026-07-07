'use client';

import { useState } from 'react';
import { useRateRules, useCreateRateRule, useDeleteRateRule, useRatePreview, RateRuleType, RateAdjustmentType } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calculator, Loader2 } from 'lucide-react';

const RULE_TYPES: RateRuleType[] = ['lane', 'weight', 'volume', 'seasonal', 'peak', 'contract', 'country', 'discount', 'markup'];
const ADJUSTMENT_TYPES: RateAdjustmentType[] = ['flat', 'percent', 'per_kg', 'per_cbm'];

export default function RateEnginePage() {
  const { toast } = useToast();
  const { data, isLoading } = useRateRules({});
  const rules = data?.items ?? [];
  const createRule = useCreateRateRule();
  const deleteRule = useDeleteRateRule();
  const preview = useRatePreview();

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({ ruleType: 'discount' as RateRuleType, originCode: '', destinationCode: '', mode: '', adjustmentType: 'percent' as RateAdjustmentType, adjustmentValue: '', priority: '100' });

  const [previewForm, setPreviewForm] = useState({ originCode: '', destinationCode: '', mode: '', baseRate: '1000', weightKg: '500', fuelPct: '0.15' });

  const handleCreateRule = async () => {
    if (!ruleForm.adjustmentValue) {
      toast({ variant: 'destructive', title: 'Adjustment value is required' });
      return;
    }
    await createRule.mutateAsync({
      ruleType: ruleForm.ruleType,
      originCode: ruleForm.originCode || undefined,
      destinationCode: ruleForm.destinationCode || undefined,
      mode: ruleForm.mode || undefined,
      adjustmentType: ruleForm.adjustmentType,
      adjustmentValue: Number(ruleForm.adjustmentValue),
      priority: Number(ruleForm.priority) || 100,
    });
    toast({ title: 'Pricing rule created' });
    setRuleOpen(false);
  };

  const handlePreview = () => {
    preview.mutate({
      originCode: previewForm.originCode || undefined,
      destinationCode: previewForm.destinationCode || undefined,
      mode: previewForm.mode || undefined,
      baseRate: Number(previewForm.baseRate) || 0,
      weightKg: Number(previewForm.weightKg) || 0,
      fuelPct: Number(previewForm.fuelPct) || 0,
    });
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rate Engine</h1>
          <p className="text-sm text-muted-foreground">Persisted lane/weight/volume/seasonal/peak/contract/country/discount/markup pricing rules.</p>
        </div>
        <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Pricing Rule</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select value={ruleForm.ruleType} onValueChange={(v) => setRuleForm((f) => ({ ...f, ruleType: v as RateRuleType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{RULE_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Origin Code</Label><Input value={ruleForm.originCode} onChange={(e) => setRuleForm((f) => ({ ...f, originCode: e.target.value.toUpperCase() }))} placeholder="Any" /></div>
                <div className="space-y-2"><Label>Destination Code</Label><Input value={ruleForm.destinationCode} onChange={(e) => setRuleForm((f) => ({ ...f, destinationCode: e.target.value.toUpperCase() }))} placeholder="Any" /></div>
              </div>
              <div className="space-y-2"><Label>Mode</Label><Input value={ruleForm.mode} onChange={(e) => setRuleForm((f) => ({ ...f, mode: e.target.value }))} placeholder="Any" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <Select value={ruleForm.adjustmentType} onValueChange={(v) => setRuleForm((f) => ({ ...f, adjustmentType: v as RateAdjustmentType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ADJUSTMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Value</Label><Input type="number" value={ruleForm.adjustmentValue} onChange={(e) => setRuleForm((f) => ({ ...f, adjustmentValue: e.target.value }))} placeholder="e.g. -10 for a 10% discount" /></div>
              </div>
              <div className="space-y-2"><Label>Priority (lower resolves first)</Label><Input type="number" value={ruleForm.priority} onChange={(e) => setRuleForm((f) => ({ ...f, priority: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRule} disabled={createRule.isPending}>
                {createRule.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <FreightNavTabs />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Calculator className="h-4 w-4" /> Rate Preview</CardTitle>
          <CardDescription>Apply the tenant's active rules to a lane/weight combo without persisting anything.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-5 gap-3">
            <div className="space-y-2"><Label>Origin</Label><Input value={previewForm.originCode} onChange={(e) => setPreviewForm((f) => ({ ...f, originCode: e.target.value.toUpperCase() }))} placeholder="CNSHA" /></div>
            <div className="space-y-2"><Label>Destination</Label><Input value={previewForm.destinationCode} onChange={(e) => setPreviewForm((f) => ({ ...f, destinationCode: e.target.value.toUpperCase() }))} placeholder="NLRTM" /></div>
            <div className="space-y-2"><Label>Mode</Label><Input value={previewForm.mode} onChange={(e) => setPreviewForm((f) => ({ ...f, mode: e.target.value }))} placeholder="ocean" /></div>
            <div className="space-y-2"><Label>Base Rate</Label><Input type="number" value={previewForm.baseRate} onChange={(e) => setPreviewForm((f) => ({ ...f, baseRate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Weight (kg)</Label><Input type="number" value={previewForm.weightKg} onChange={(e) => setPreviewForm((f) => ({ ...f, weightKg: e.target.value }))} /></div>
          </div>
          <Button onClick={handlePreview} disabled={preview.isPending} size="sm">
            {preview.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Compute Rate
          </Button>

          {preview.data && (
            <div className="grid md:grid-cols-4 gap-3 pt-2 border-t">
              <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Base Rate</p><p className="font-bold">{preview.data.baseRate}</p></div>
              <div><p className="text-[10px] uppercase text-muted-foreground font-bold">After Rules</p><p className="font-bold">{preview.data.finalRate}</p></div>
              <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Fuel Surcharge</p><p className="font-bold">{preview.data.fuelSurcharge}</p></div>
              <div><p className="text-[10px] uppercase text-muted-foreground font-bold">Total</p><p className="font-bold text-primary">{preview.data.totalWithFuel}</p></div>
              {preview.data.appliedRules.length > 0 && (
                <div className="md:col-span-4 flex flex-wrap gap-1.5">
                  {preview.data.appliedRules.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-[9px]">{r.ruleType}: {r.delta >= 0 ? '+' : ''}{r.delta}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Pricing Rules</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading && <p className="text-sm text-muted-foreground py-10 text-center">Loading rules…</p>}
          {!isLoading && rules.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">No pricing rules yet — every quote uses each carrier's base rate as-is.</p>}
          {!isLoading && rules.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="capitalize font-medium">{r.ruleType}</TableCell>
                    <TableCell className="text-xs">{r.originCode ?? 'Any'} → {r.destinationCode ?? 'Any'}</TableCell>
                    <TableCell className="text-xs capitalize">{r.mode ?? 'Any'}</TableCell>
                    <TableCell className="text-xs">{r.adjustmentType}: {r.adjustmentValue}</TableCell>
                    <TableCell className="text-xs">{r.priority}</TableCell>
                    <TableCell><Badge variant={r.active ? 'success' : 'outline'} className="text-[9px]">{r.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => deleteRule.mutate(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
