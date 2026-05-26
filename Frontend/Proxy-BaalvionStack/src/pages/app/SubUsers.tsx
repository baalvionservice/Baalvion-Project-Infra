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
import { Users, UserPlus, MoreVertical, Trash2, Shield, Loader2, Mail } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useSubUsers, useInviteSubUser, useRemoveSubUser, useUpdateMemberRole } from "@/hooks/usePlatform";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access except billing" },
  { value: "developer", label: "Developer", description: "API keys & proxies" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
];

const roleColors: Record<string, string> = {
  owner: "bg-warning/10 text-warning border-warning/30",
  admin: "bg-primary/10 text-primary border-primary/30",
  developer: "bg-accent/10 text-accent border-accent/30",
  viewer: "bg-muted text-muted-foreground",
};

export default function SubUsers() {
  const { data: members, isLoading } = useSubUsers();
  const invite = useInviteSubUser();
  const remove = useRemoveSubUser();
  const updateRole = useUpdateMemberRole();
  const { toast } = useToast();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("viewer");
  const [search, setSearch] = useState("");

  const filtered = (members ?? []).filter(m =>
    !search || m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = async () => {
    if (!email.trim()) return;
    try {
      const result = await invite.mutateAsync({ email: email.trim(), role }) as Record<string, unknown>;
      setEmail(""); setRole("viewer"); setInviteOpen(false);
      if (result?.emailPreviewUrl) {
        toast({
          title: "Invitation sent!",
          description: (
            <span>
              Email sent to <strong>{email}</strong>.{" "}
              <a href={result.emailPreviewUrl as string} target="_blank" rel="noreferrer"
                className="underline text-primary">Preview email →</a>
            </span>
          ) as unknown as string,
          duration: 10000,
        });
      }
    } catch {
      // error toast handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Sub-Users" description="Manage team members and sub-users." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sub-Users</h1>
          <p className="text-muted-foreground">Manage team members and their access levels.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Invite User
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Members", value: members?.length ?? 0, icon: Users },
          { label: "Active", value: (members ?? []).filter(m => m.status !== "suspended").length, icon: Shield },
          { label: "Pending Invites", value: (members ?? []).filter(m => m.status === "pending").length, icon: Mail },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Team Members
            </CardTitle>
            <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 justify-center py-8 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading members...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No members yet</p>
              <p className="text-sm mt-1">Invite team members to collaborate.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(m => (
                <div key={m.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {(m.name || m.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{m.name || m.email}</p>
                      {m.name && <p className="text-xs text-muted-foreground">{m.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={roleColors[m.role] ?? ""}>
                      {m.role}
                    </Badge>
                    {m.status === "pending" && <Badge variant="warning">Pending</Badge>}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ROLES.map(r => (
                          <DropdownMenuItem key={r.value} disabled={m.role === r.value}
                            onClick={() => updateRole.mutate({ id: m.id, role: r.value })}>
                            <Shield className="w-4 h-4 mr-2" /> Set as {r.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive"
                          onClick={() => setConfirmRemove(m.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input placeholder="colleague@company.com" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleInvite()} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      <div>
                        <div className="font-medium">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!email.trim() || invite.isPending}>
              {invite.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>They will lose access immediately. You can re-invite them later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground"
              onClick={() => { remove.mutate(confirmRemove!); setConfirmRemove(null); }}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
