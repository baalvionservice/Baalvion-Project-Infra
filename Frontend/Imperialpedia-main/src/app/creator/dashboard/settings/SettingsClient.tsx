'use client';

import React, { useState } from 'react';
import { CreatorSettings } from '@/types';
import { Text } from '@/design-system/typography/text';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Globe, 
  Camera, 
  Save, 
  Twitter, 
  Linkedin, 
  ExternalLink,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SettingsClientProps {
  initialSettings: CreatorSettings;
}

/**
 * High-fidelity settings suite for platform experts.
 * Optimized for professional profile management and notification logistics.
 */
export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [settings, setSettings] = useState<CreatorSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Mock API persistence delay
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    toast({
      title: "Settings Synchronized",
      description: "Your expert profile and preferences have been updated.",
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <header>
        <div className="flex items-center gap-2 text-primary mb-1">
          <Shield className="h-4 w-4" />
          <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Expert Control</Text>
        </div>
        <Text variant="h1" className="text-3xl font-bold">Studio Settings</Text>
        <Text variant="bodySmall" className="text-muted-foreground mt-1">
          Manage your professional identity and intelligence delivery preferences.
        </Text>
      </header>

      <form onSubmit={handleSave}>
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-card/30 border border-white/5 p-1 h-12 w-full justify-start lg:w-auto">
            <TabsTrigger value="profile" className="gap-2 px-6 h-10 rounded-lg"><User className="h-4 w-4" /> Profile</TabsTrigger>
            <TabsTrigger value="account" className="gap-2 px-6 h-10 rounded-lg"><Mail className="h-4 w-4" /> Account</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 px-6 h-10 rounded-lg"><Bell className="h-4 w-4" /> Alerts</TabsTrigger>
          </TabsList>

          {/* Profile Customization Section */}
          <TabsContent value="profile" className="space-y-8 animate-in fade-in duration-300">
            <Card className="glass-card border-none overflow-hidden">
              <CardHeader className="bg-card/30 border-b">
                <CardTitle>Public Persona</CardTitle>
                <CardDescription>How you appear to the Imperialpedia Intelligence Network.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                {/* Avatar Management */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <Avatar className="h-32 w-32 rounded-[2.5rem] border-4 border-background shadow-2xl ring-1 ring-white/10">
                      <AvatarImage src={settings.profileImage} />
                      <AvatarFallback className="text-2xl">{settings.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <Text variant="body" weight="bold">Profile Photograph</Text>
                    <Text variant="caption" className="text-muted-foreground block max-w-xs">
                      High-resolution images (min 400x400px) are recommended for verified experts.
                    </Text>
                    <div className="flex gap-2 justify-center md:justify-start">
                      <Button type="button" size="sm" variant="outline">Change Photo</Button>
                      <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive">Remove</Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Expert Handle</Label>
                    <Input 
                      value={settings.displayName} 
                      onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                      placeholder="e.g. Eleanor Vance" 
                      className="bg-background/50 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Intelligence Taxonomy</Label>
                    <Input 
                      value={settings.categories.join(', ')} 
                      placeholder="Economics, Macro, DeFi" 
                      className="bg-background/50 h-12"
                      disabled
                    />
                    <Text variant="caption" className="text-muted-foreground ml-1">Assigned based on verified expertise matrix.</Text>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Professional Narrative (Bio)</Label>
                  <Textarea 
                    value={settings.bio} 
                    onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                    placeholder="Describe your research focus and industry experience..." 
                    className="bg-background/50 min-h-[120px] text-base leading-relaxed"
                  />
                </div>

                {/* Social Links Matrix */}
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-secondary font-bold text-sm">
                    <ExternalLink className="h-4 w-4" /> Social Authority Nodes
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {settings.socialLinks.map((link, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                          {link.platform === 'Twitter' ? <Twitter className="h-4 w-4" /> : <Linkedin className="h-4 w-4" />}
                        </div>
                        <Input 
                          value={link.url} 
                          className="pl-10 bg-background/50 h-11" 
                          placeholder={`${link.platform} URL`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Logistics Section */}
          <TabsContent value="account" className="space-y-8 animate-in fade-in duration-300">
            <Card className="glass-card border-none">
              <CardHeader className="bg-card/30 border-b">
                <CardTitle>System Credentials</CardTitle>
                <CardDescription>Manage your primary access and security infrastructure.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Communication Node (Email)</Label>
                  <div className="flex gap-4">
                    <Input value={settings.email} className="bg-background/50 h-12 flex-1" disabled />
                    <Button type="button" variant="outline" className="h-12 px-6">Change</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">Secret Key (Password)</Label>
                  <div className="flex gap-4">
                    <Input type="password" value="••••••••••••" className="bg-background/50 h-12 flex-1" disabled />
                    <Button type="button" variant="outline" className="h-12 px-6">Rotate Key</Button>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 flex items-center justify-between mt-10">
                  <div>
                    <Text variant="bodySmall" weight="bold" className="text-destructive">Deactivate Expert Hub</Text>
                    <Text variant="caption" className="text-muted-foreground">Permanently remove your identity and research from the index.</Text>
                  </div>
                  <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4 mr-2" /> Deactivate</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alert Preferences Section */}
          <TabsContent value="notifications" className="space-y-8 animate-in fade-in duration-300">
            <Card className="glass-card border-none">
              <CardHeader className="bg-card/30 border-b">
                <CardTitle>Intelligence Feed Logistics</CardTitle>
                <CardDescription>Configure how the platform keeps you informed.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="space-y-1">
                    <Text variant="body" weight="bold">Content Engagement Velocity</Text>
                    <Text variant="caption" className="text-muted-foreground">Receive real-time alerts for likes, comments, and shares on your analysis.</Text>
                  </div>
                  <Switch 
                    checked={settings.notifications.engagement} 
                    onCheckedChange={(val) => setSettings({ ...settings, notifications: { ...settings.notifications, engagement: val } })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="space-y-1">
                    <Text variant="body" weight="bold">Expert Network Growth</Text>
                    <Text variant="caption" className="text-muted-foreground">Alerts for new followers and mentions in adjacent intelligence nodes.</Text>
                  </div>
                  <Switch 
                    checked={settings.notifications.followers} 
                    onCheckedChange={(val) => setSettings({ ...settings, notifications: { ...settings.notifications, followers: val } })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className="space-y-1">
                    <Text variant="body" weight="bold">Strategic Platform Priorities</Text>
                    <Text variant="caption" className="text-muted-foreground">Announcements regarding new pSEO taxonomies and platform features.</Text>
                  </div>
                  <Switch 
                    checked={settings.notifications.announcements} 
                    onCheckedChange={(val) => setSettings({ ...settings, notifications: { ...settings.notifications, announcements: val } })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Save Action */}
        <div className="fixed bottom-8 right-8 lg:right-12 z-50">
          <Button 
            type="submit" 
            size="lg" 
            className="h-14 px-10 rounded-2xl font-bold shadow-2xl shadow-primary/40 bg-primary hover:bg-primary/90 transition-all scale-105 active:scale-95"
            disabled={isSaving}
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Synchronizing...</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Commit Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
