import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, MoreHorizontal, Trash2, Shield, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useOrgMembers, useInviteMember, useRemoveMember, useUpdateMemberRole } from "@/hooks/usePlatform";

const ROLES = ["owner", "admin", "developer", "viewer"];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-warning/10 text-warning border-warning/30",
  admin: "bg-primary/10 text-primary border-primary/30",
  developer: "bg-accent/10 text-accent border-accent/30",
  viewer: "bg-muted text-muted-foreground",
};

export default function OrganizationMembers() {
  const { data: members, isLoading } = useOrgMembers();
  const invite = useInviteMember();
  const remove = useRemoveMember();
  const updateRole = useUpdateMemberRole();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const filtered = (members ?? []).filter(m =>
    !search || (m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (m.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!email.trim()) return;
    await invite.mutateAsync({ email: email.trim(), role });
    setEmail(""); setRole("viewer"); setInviteOpen(false);
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Organization Members" description="Manage organization members." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage who has access to your organization.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> All Members
              <Badge variant="outline">{members?.length ?? 0}</Badge>
            </CardTitle>
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-56" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No members found.</TableCell></TableRow>
                ) : filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {(m.name || m.email || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{m.name || m.email}</p>
                          {m.name && <p className="text-xs text-muted-foreground">{m.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[m.role] ?? ""}`}>{m.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === "pending" ? "warning" : "success"} className="text-xs">
                        {m.status ?? "active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {m.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ROLES.filter(r => r !== "owner" && r !== m.role).map(r => (
                              <DropdownMenuItem key={r} onClick={() => updateRole.mutate({ id: m.id, role: r })}>
                                <Shield className="w-4 h-4 mr-2" /> Set as {r}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive"
                              onClick={() => setConfirmRemove(m.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input placeholder="person@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.filter(r => r !== "owner").map(r => (
                    <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!email.trim() || invite.isPending}>
              {invite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>They will lose all access to this organization immediately.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground"
              onClick={() => { remove.mutate(confirmRemove!); setConfirmRemove(null); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
