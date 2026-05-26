import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreditCard, Plus, Trash2, Star, Loader2, Building2, Wallet } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { usePaymentMethods, useAddPaymentMethod, useDeletePaymentMethod } from "@/hooks/usePlatform";

const cardIcons: Record<string, string> = {
  visa: "VISA", mastercard: "MC", amex: "AMEX", rupay: "RuPay",
};

const typeIcon = (type: string) => {
  if (type === "card") return CreditCard;
  if (type === "bank") return Building2;
  return Wallet;
};

export default function BillingMethods() {
  const { data: methods, isLoading } = usePaymentMethods();
  const addMethod = useAddPaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [addOpen, setAddOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState({ brand: "visa", last4: "", expiry: "", isDefault: false });

  const handleAdd = async () => {
    if (!form.last4 || form.last4.length !== 4) return;
    await addMethod.mutateAsync({ type: "card", brand: form.brand, last4: form.last4, expiry: form.expiry, isDefault: form.isDefault });
    setForm({ brand: "visa", last4: "", expiry: "", isDefault: false });
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Payment Methods" description="Manage your payment methods." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Methods</h1>
          <p className="text-muted-foreground">Manage your saved payment methods.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Method
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />Saved Methods</CardTitle>
          <CardDescription>Your default method is used for automatic renewals.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : (methods ?? []).length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No payment methods saved.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(methods ?? []).map(m => {
                const Icon = typeIcon(m.type);
                return (
                  <div key={m.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${m.isDefault ? "border-primary/50 bg-primary/5" : "bg-secondary/30 border-transparent"}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{m.brand ? cardIcons[m.brand] ?? m.brand : m.type}</span>
                          {m.last4 && <span className="text-muted-foreground text-sm">•••• {m.last4}</span>}
                          {m.isDefault && <Badge variant="success" className="text-xs">Default</Badge>}
                        </div>
                        {m.expiry && <p className="text-xs text-muted-foreground">Expires {m.expiry}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!m.isDefault && (
                        <Button variant="ghost" size="sm" className="text-xs gap-1"
                          onClick={() => addMethod.mutate({ ...m, isDefault: true })}>
                          <Star className="w-3 h-3" /> Set Default
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8"
                        onClick={() => setConfirmDelete(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Method Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Card Brand</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
                <option value="rupay">RuPay</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Last 4 Digits</Label>
              <Input placeholder="4242" maxLength={4} value={form.last4}
                onChange={e => setForm(f => ({ ...f, last4: e.target.value.replace(/\D/g, "") }))} />
            </div>
            <div className="space-y-2">
              <Label>Expiry (MM/YY)</Label>
              <Input placeholder="12/28" value={form.expiry}
                onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isDefault}
                onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
              <span className="text-sm">Set as default payment method</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={form.last4.length !== 4 || addMethod.isPending}>
              {addMethod.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method?</AlertDialogTitle>
            <AlertDialogDescription>This card will be removed from your account.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground"
              onClick={() => { deleteMethod.mutate(confirmDelete!); setConfirmDelete(null); }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
