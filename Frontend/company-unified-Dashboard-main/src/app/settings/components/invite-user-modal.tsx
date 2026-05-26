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
import businessesData from "@/lib/data/businesses";
import { useToast } from "@/hooks/use-toast";
import { type Role } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

const roles: Role[] = ["ADMIN", "INVESTOR", "CO_FOUNDER", "EMPLOYEE"];

interface InviteUserModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function InviteUserModal({
  isOpen,
  onOpenChange,
}: InviteUserModalProps) {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
    toast({
      title: "Invitation Sent",
      description: "The user has been invited to join your platform.",
    });
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
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0) +
                      role.slice(1).toLowerCase().replace("_", "-")}
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
            <Button type="submit">Send Invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
