"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDashboardRefs } from "@/hooks/use-dashboard-refs";
import { dashboardApi } from "@/lib/api-client";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import InviteUserModal from "./invite-user-modal";
import { formatDistanceToNow } from "date-fns";

interface EditUser { id: string; name: string; role: string; status: string }

export default function UsersRoles() {
  const { toast } = useToast();
  const { businesses: businessesData, employees: usersData } = useDashboardRefs();
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [editing, setEditing] = useState<EditUser | null>(null);
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = () => window.dispatchEvent(new CustomEvent("refs-changed"));

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    setSelectedUsers(checked === true ? usersData.map((u) => u.id) : []);
  };
  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(checked ? [...selectedUsers, userId] : selectedUsers.filter((id) => id !== userId));
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await dashboardApi.updateEmployee(editing.id, { name: editing.name, role: editing.role, status: editing.status });
      setEditing(null);
      refresh();
      toast({ title: "User updated" });
    } catch (err) {
      toast({ title: "Could not update user", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (user: { id: string; name: string; status: string }) => {
    const next = (user.status || "active").toLowerCase() === "inactive" ? "active" : "inactive";
    try {
      await dashboardApi.updateEmployee(user.id, { status: next });
      refresh();
      toast({ title: next === "inactive" ? "User deactivated" : "User reactivated", description: user.name });
    } catch (err) {
      toast({ title: "Could not update status", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    setSaving(true);
    const name = removing.name;
    try {
      await dashboardApi.deleteEmployee(removing.id);
      setRemoving(null);
      refresh();
      toast({ title: "User removed", description: `${name} was removed.` });
    } catch (err) {
      toast({ title: "Could not remove user", description: err instanceof Error ? err.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users & Roles</CardTitle>
              <CardDescription>Manage your team and their platform access.</CardDescription>
            </div>
            <Button onClick={() => setInviteModalOpen(true)}>
              <PlusCircle className="mr-2" /> Invite User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8 sm:w-[50px]">
                    <Checkbox
                      onCheckedChange={handleSelectAll}
                      checked={selectedUsers.length === usersData.length && usersData.length > 0 ? true : selectedUsers.length > 0 ? "indeterminate" : false}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Businesses</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData.map((user) => {
                  const userImage = PlaceHolderImages.find((p) => p.id === user.imageId);
                  const isActive = (user.status || "active").toLowerCase() !== "inactive";
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {userImage && <AvatarImage src={userImage.imageUrl} />}
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{businessesData.length}</TableCell>
                      <TableCell>{formatDistanceToNow(new Date(), { addSuffix: true })}</TableCell>
                      <TableCell>
                        <Badge variant="default" className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setEditing({ id: user.id, name: user.name, role: user.role, status: user.status || "active" })}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeactivate({ id: user.id, name: user.name, status: user.status })}>
                              {isActive ? "Deactivate" : "Reactivate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setRemoving({ id: user.id, name: user.name })}>
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InviteUserModal isOpen={isInviteModalOpen} onOpenChange={setInviteModalOpen} />

      {/* Edit user */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update this team member&apos;s details.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="u-name">Name</Label>
                <Input id="u-name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="u-role">Role / Title</Label>
                <Input id="u-role" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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

      {/* Remove confirm */}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the user from your team. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
