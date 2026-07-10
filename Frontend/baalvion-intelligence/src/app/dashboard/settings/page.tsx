import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="mt-6 max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-name">Full name</Label>
          <Input id="settings-name" defaultValue="Jordan Rivera" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-email">Email</Label>
          <Input id="settings-email" type="email" defaultValue="jordan@example.com" />
        </div>
        <Button size="sm">Save changes</Button>
      </TabsContent>

      <TabsContent value="password" className="mt-6 max-w-md space-y-4">
        <div className="space-y-2">
          <Label htmlFor="settings-current-password">Current password</Label>
          <Input id="settings-current-password" type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="settings-new-password">New password</Label>
          <Input id="settings-new-password" type="password" />
        </div>
        <Button size="sm">Update password</Button>
      </TabsContent>

      <TabsContent value="notifications" className="mt-6 max-w-md space-y-3 text-sm text-muted-foreground">
        <p>Weekly usage summary — email</p>
        <p>Alert delivery failures — email</p>
        <p>Billing receipts — email</p>
      </TabsContent>

      <TabsContent value="team" className="mt-6 max-w-md space-y-3 text-sm text-muted-foreground">
        <p>4 seats used on the Growth plan. Invite teammates from the Billing page.</p>
      </TabsContent>

      <TabsContent value="security" className="mt-6 max-w-md space-y-4">
        <p className="text-sm text-muted-foreground">Two-factor authentication is not yet enabled.</p>
        <Button variant="outline" size="sm">
          Enable 2FA
        </Button>
      </TabsContent>
    </Tabs>
  );
}
