import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Shield, 
  Bell, 
  Globe,
  Key,
  Trash2,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { accountApi } from "@/lib/platformClient";

export default function Settings() {
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);

  // Load the real profile.
  useEffect(() => {
    accountApi.getProfile().then((p) => setProfile({
      name: p.name ?? "",
      email: p.email ?? "",
      company: p.company ?? "",
      timezone: p.timezone || "America/New_York",
    })).catch(() => { /* keep defaults */ });
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await accountApi.updateProfile({ name: profile.name, company: profile.company, timezone: profile.timezone });
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (e) {
      toast({ title: "Couldn't save profile", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (currentPassword.length < 8 || newPassword.length < 8) {
      toast({ title: "Invalid password", description: "Both passwords must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      await accountApi.changePassword(currentPassword, newPassword);
      setCurrentPassword(""); setNewPassword("");
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
    } catch (e) {
      toast({ title: "Couldn't update password", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@company.com",
    company: "Tech Corp",
    timezone: "America/New_York",
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    usageAlerts: true,
    weeklyReports: true,
    marketingEmails: false,
    securityAlerts: true,
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    sessionTimeout: "30",
    ipWhitelist: "",
  });

  const handleSave = (section: string) => {
    toast({
      title: "Settings Saved",
      description: `${section} settings have been updated successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Settings" description="Manage your account preferences, security settings, and notification preferences." />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and security settings.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Settings */}
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile Settings</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    readOnly
                    title="Contact support to change your account email"
                    className="bg-secondary/50 border-border/50 opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                    <SelectTrigger className="bg-secondary/50 border-border/50">
                      <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingProfile ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <CardTitle className="text-lg">Security</CardTitle>
                  <CardDescription>Manage your password and security preferences</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Change Password */}
              <div>
                <h4 className="font-medium mb-4">Change Password</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="bg-secondary/50 border-border/50 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-secondary/50 border-border/50 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleChangePassword} disabled={changingPassword}>
                    <Key className="w-4 h-4 mr-2" />
                    {changingPassword ? "Updating…" : "Update Password"}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Two-Factor Auth */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={security.twoFactorEnabled}
                  onCheckedChange={(checked) => setSecurity({ ...security, twoFactorEnabled: checked })}
                />
              </div>

              <Separator />

              {/* Session Timeout */}
              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Select 
                  value={security.sessionTimeout} 
                  onValueChange={(v) => setSecurity({ ...security, sessionTimeout: v })}
                >
                  <SelectTrigger className="w-[200px] bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* IP Whitelist */}
              <div className="space-y-2">
                <Label htmlFor="ip-whitelist">IP Whitelist (Optional)</Label>
                <Input 
                  id="ip-whitelist" 
                  placeholder="e.g., 192.168.1.1, 10.0.0.1"
                  value={security.ipWhitelist}
                  onChange={(e) => setSecurity({ ...security, ipWhitelist: e.target.value })}
                  className="bg-secondary/50 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of IPs allowed to access your account
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSave("Security")}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card variant="default">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Configure how you receive updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "emailAlerts", label: "Email Alerts", description: "Receive important account alerts via email" },
                { key: "usageAlerts", label: "Usage Alerts", description: "Get notified when approaching bandwidth limits" },
                { key: "weeklyReports", label: "Weekly Reports", description: "Receive weekly usage and performance reports" },
                { key: "securityAlerts", label: "Security Alerts", description: "Get notified about security-related events" },
                { key: "marketingEmails", label: "Marketing Emails", description: "Receive product updates and offers" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                  />
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button onClick={() => handleSave("Notification")}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card variant="stats">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">JD</span>
                </div>
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <Badge variant="default">Enterprise</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>Jan 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account ID</span>
                  <span className="font-mono text-xs">ACC-8472</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/app/billing">Billing & Invoices</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/app/api-keys">API Keys</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/app/sub-users">Manage Sub-Users</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card variant="default" className="border-destructive/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}