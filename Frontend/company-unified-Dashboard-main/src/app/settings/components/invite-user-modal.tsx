"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/lib/api-client";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

// Org-membership roles understood by auth-service's invite API.
const roles = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

interface InviteUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function InviteUserModal({
  isOpen,
  onOpenChange,
}: InviteUserModalProps) {
  const { toast } = useToast();
  const { businesses: businessesData } = useDashboardRefs();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast({ title: "Email required", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      // Real invite → auth-gateway POST /auth/invite → auth-service team API (org member invite).
      await authApi.invite({ email: email.trim(), role });
      onOpenChange(false);
      setEmail("");
      setRole("member");
      toast({ title: "Invitation Sent", description: `An invite was sent to ${email.trim()}.` });
    } catch (err) {
      toast({ title: "Could not send invitation", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Enter the user's details to send them an invitation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Business Access</Label>
            <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-2">
                <Checkbox id="all-businesses" />
                <Label htmlFor="all-businesses" className="font-semibold">
                  All Businesses
                </Label>
              </div>
              <Separator />
              {businessesData.map((biz) => (
                <div key={biz.id} className="flex items-center gap-2">
                  <Checkbox id={`biz-access-${biz.id}`} />
                  <Label
                    htmlFor={`biz-access-${biz.id}`}
                    className="font-normal"
                  >
                    {biz.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send Invitation"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
