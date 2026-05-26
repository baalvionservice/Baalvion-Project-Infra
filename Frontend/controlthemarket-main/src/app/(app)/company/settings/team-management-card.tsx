"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, PlusCircle, MoreHorizontal, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import * as api from "@/lib/api";
import type { User, CompanyRole } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const companyRoles: CompanyRole[] = ["owner", "admin", "member"];

export function TeamManagementCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [roleToInvite, setRoleToInvite] = useState<CompanyRole>("member");

  useEffect(() => {
    if (user?.companyId) {
      api.getUsers().then((allUsers) => {
        setTeamMembers(allUsers.filter((u) => u.companyId === user.companyId));
      });
    }
  }, [user]);

  const handleInviteUser = async () => {
    if (!emailToInvite) {
      toast({ title: "Email is required", variant: "destructive" });
      return;
    }

    const newUser = await api.createUser({
      name: "New Member",
      email: emailToInvite,
      role: "company",
      companyRole: roleToInvite,
      companyId: user?.companyId,
      isActive: true,
      isVerified: false,
      profile: {
        avatarUrl: `https://picsum.photos/seed/${Date.now()}/100/100`,
      },
    });

    setTeamMembers((prev) => [...prev, newUser.data]);
    toast({
      title: "Invitation Sent",
      description: `An invitation has been sent to ${emailToInvite}.`,
    });
    setEmailToInvite("");
    setRoleToInvite("member");
    setIsInviteOpen(false);
  };

  const handleRemoveUser = (userId: string) => {
    setTeamMembers((prev) => prev.filter((u) => u.id !== userId));
    api.updateUser(userId, { isActive: false }); // "Remove" by deactivating
    toast({
      title: "User Removed",
      description: "The user has been removed from your team.",
    });
  };

  const handleRoleChange = (userId: string, newRole: CompanyRole) => {
    setTeamMembers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, companyRole: newRole } : u))
    );
    api.updateUser(userId, { companyRole: newRole });
    toast({
      title: "Role Updated",
      description: `The user's role has been updated to ${newRole}.`,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <CardDescription>
            Manage users and their roles in your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile?.avatarUrl} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.companyRole}
                      onValueChange={(newRole) =>
                        handleRoleChange(member.id, newRole as CompanyRole)
                      }
                      disabled={member.companyRole === "owner"}
                    >
                      <SelectTrigger className="w-[120px]capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {companyRoles.map((r) => (
                          <SelectItem key={r} value={r} className="capitalize">
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={member.companyRole === "owner"}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveUser(member.id)}
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Invite Team Member
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a New Team Member</DialogTitle>
            <DialogDescription>
              Enter the email address and role for the new team member. They
              will receive an email to join your team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={emailToInvite}
                onChange={(e) => setEmailToInvite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={roleToInvite}
                onValueChange={(value) => setRoleToInvite(value as CompanyRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companyRoles
                    .filter((r) => r !== "owner")
                    .map((role) => (
                      <SelectItem
                        key={role}
                        value={role}
                        className="capitalize"
                      >
                        {role}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInviteUser}>
              <UserPlus className="mr-2 h-4 w-4" /> Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
