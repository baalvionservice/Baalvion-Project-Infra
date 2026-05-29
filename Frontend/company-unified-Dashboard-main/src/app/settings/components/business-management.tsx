"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AddBusinessModal from "./add-business-modal";
import { format } from "date-fns";
import UpgradeModal from "@/components/upgrade-modal";
import { dashboardApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

const MAX_BUSINESSES = 50; // plan-tier limit (Pro)

interface BizCard { id: string; name: string; country: string; currency: string; status: string; imageId: string }

export default function BusinessManagement() {
  const { toast } = useToast();
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [businessesData, setBusinessesData] = useState<BizCard[]>([]);
  const [editing, setEditing] = useState<BizCard | null>(null);
  const [deleting, setDeleting] = useState<BizCard | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await dashboardApi.businesses();
      const list = (((res as { data?: unknown[] })?.data ?? res ?? []) as Record<string, unknown>[]);
      setBusinessesData(list.map((b) => ({
        id: String(b.id), name: String(b.name ?? ""), country: String(b.country ?? ""),
        currency: String(b.currency ?? ""), status: String(b.status ?? ""), imageId: `biz-${b.id}`,
      })));
    } catch { /* leave empty */ }
  }, []);

  useEffect(() => {
    load();
    const onChanged = () => load();
    window.addEventListener("business-created", onChanged);
    window.addEventListener("refs-changed", onChanged);
    return () => {
      window.removeEventListener("business-created", onChanged);
      window.removeEventListener("refs-changed", onChanged);
    };
  }, [load]);

  const handleAddBusinessClick = () => {
    if (businessesData.length >= MAX_BUSINESSES) setUpgradeModalOpen(true);
    else setAddModalOpen(true);
  };

  const handleArchive = async (biz: BizCard) => {
    try {
      await dashboardApi.updateBusiness(biz.id, { status: "Archived" });
      await load();
      window.dispatchEvent(new CustomEvent("refs-changed"));
      toast({ title: "Business archived", description: `${biz.name} is now archived.` });
    } catch (err) {
      toast({ title: "Could not archive", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    }
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await dashboardApi.updateBusiness(editing.id, {
        name: editing.name, country: editing.country, currency: editing.currency, status: editing.status,
      });
      setEditing(null);
      await load();
      window.dispatchEvent(new CustomEvent("refs-changed"));
      toast({ title: "Business updated" });
    } catch (err) {
      toast({ title: "Could not update", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    const name = deleting.name;
    try {
      await dashboardApi.deleteBusiness(deleting.id);
      setDeleting(null);
      await load();
      window.dispatchEvent(new CustomEvent("refs-changed"));
      toast({ title: "Business deleted", description: `${name} was removed.` });
    } catch (err) {
      toast({ title: "Could not delete", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Management</CardTitle>
              <CardDescription>Manage your portfolio of businesses.</CardDescription>
            </div>
            <Button onClick={handleAddBusinessClick}>
              <PlusCircle className="mr-2" /> Add Business
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {businessesData.map((biz) => {
            const image = PlaceHolderImages.find((p) => p.id === biz.imageId);
            return (
              <Card key={biz.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {image && <AvatarImage src={image.imageUrl} />}
                      <AvatarFallback>{biz.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{biz.name}</p>
                      <p className="text-sm text-muted-foreground">{biz.country}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setEditing(biz)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchive(biz)}>Archive</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(biz)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Created:</span>{" "}
                    <span className="font-medium">{format(new Date(), "PP")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan Tier:</span> <Badge variant="outline">Enterprise</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>{" "}
                    <Badge variant="default" className="bg-green-100 text-green-800">{biz.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <AddBusinessModal isOpen={isAddModalOpen} onOpenChange={setAddModalOpen} />
      <UpgradeModal isOpen={isUpgradeModalOpen} onOpenChange={setUpgradeModalOpen} />

      {/* Edit business */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>Update the business details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <Input id="edit-country" value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Input id="edit-currency" value={editing.currency} onChange={(e) => setEditing({ ...editing, currency: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Growth">Growth</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the business and its data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
