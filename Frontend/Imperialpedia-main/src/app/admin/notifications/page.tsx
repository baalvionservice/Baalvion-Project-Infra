'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Text } from '@/design-system/typography/text';
import { 
  Bell, 
  Plus, 
  Send, 
  Edit, 
  Trash2, 
  Clock, 
  Search, 
  Loader2,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Megaphone,
  Filter,
  Users,
  Save
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { systemService } from '@/services/data/system-service';
import { SystemNotification, SystemNotificationType, SystemNotificationTarget } from '@/types/system';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

/**
 * Administrative Notification Management Hub.
 * Allows leads to broadcast system alerts and manage messaging lifecycle.
 */
export default function AdminNotificationManagementPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<SystemNotification | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await systemService.getNotifications();
      setNotifications(response.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleOpenEdit = (notif?: SystemNotification) => {
    setCurrentNotif(notif || {
      id: '',
      title: '',
      message: '',
      active: true,
      type: 'info',
      target: 'all',
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentNotif) return;

    setIsSaving(true);
    const response = await systemService.updateNotification(currentNotif);
    setIsSaving(false);

    if (response.status === 200) {
      if (currentNotif.id) {
        setNotifications(prev => prev.map(n => n.id === currentNotif.id ? currentNotif : n));
      } else {
        setNotifications(prev => [{ ...currentNotif, id: `sn-${Math.random().toString(36).substr(2, 5)}` }, ...prev]);
      }
      toast({
        title: currentNotif.id ? "Notification Updated" : "Notification Created",
        description: `Broadcast parameters for "${currentNotif.title}" have been synchronized.`,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const response = await systemService.deleteNotification(id);
    if (response.status === 200) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: "Notification Purged",
        description: "Message has been removed from the intelligence index.",
        variant: "destructive"
      });
    }
  };

  const handleToggleActive = (id: string, current: boolean) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, active: !current } : n));
    toast({
      title: !current ? "Notification Activated" : "Notification Sunset",
      description: `Visibility has been updated.`,
    });
  };

  const filteredNotifs = notifications.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.message.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeIcon = (type: SystemNotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <Info className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Megaphone className="h-4 w-4" />
            <Text variant="label" className="text-[10px] font-bold tracking-widest uppercase">Messaging Control</Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold">System Notifications</Text>
          <Text variant="bodySmall" className="text-muted-foreground mt-1">
            Broadcast intelligence alerts and strategic platform updates.
          </Text>
        </div>
        <Button onClick={() => handleOpenEdit()} className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Create Broadcast
        </Button>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-card/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search broadcast archive..." 
            className="pl-10 bg-background/50 h-11 border-white/10 rounded-xl" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="h-11 px-4 gap-2 border-white/10 bg-background/30 rounded-xl">
          <Filter className="h-3.5 w-3.5" /> Filter Matrix
        </Badge>
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b border-white/5">
                <TableHead className="pl-6 font-bold text-[10px] uppercase tracking-widest">Notification Identity</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Type</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Target Audience</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="text-right pr-6 font-bold text-[10px] uppercase tracking-widest">Administrative Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                    <Text variant="caption" className="mt-4 block animate-pulse">Syncing Broadcast Matrix...</Text>
                  </TableCell>
                </TableRow>
              ) : filteredNotifs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">
                    No matching broadcasts found in the intelligence index.
                  </TableCell>
                </TableRow>
              ) : filteredNotifs.map((notif) => (
                <TableRow key={notif.id} className="group hover:bg-muted/10 transition-colors border-b border-white/5">
                  <TableCell className="py-5 pl-6">
                    <div className="flex flex-col max-w-sm">
                      <span className="text-sm font-bold truncate">{notif.title}</span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 mt-1">{notif.message}</span>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground uppercase tracking-tighter">
                          Created {format(new Date(notif.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="outline" className="bg-muted/20 border-white/5 gap-1.5 font-bold uppercase text-[9px] h-6 px-2">
                        {getTypeIcon(notif.type)} {notif.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold uppercase text-[9px] h-6 px-2">
                        <Users className="h-2.5 w-2.5 mr-1" /> {notif.target}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Switch 
                        checked={notif.active} 
                        onCheckedChange={() => handleToggleActive(notif.id, notif.active)}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => handleOpenEdit(notif)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-muted-foreground hover:text-destructive transition-colors"
                        onClick={() => handleDelete(notif.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-2">
                        <Send className="h-3.5 w-3.5" /> Broadcast
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Messaging Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card bg-primary/5 border-primary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 w-fit text-primary">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Strategic Communication</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Use system notifications to guide experts toward strategic taxonomies. Messages are pushed to the Creator Studio Activity Feed in real-time.
            </Text>
          </div>
        </Card>
        
        <Card className="glass-card border-secondary/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-secondary/10 w-fit text-secondary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Audience Segmentation</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Target specific groups to reduce communication fatigue. "Experts Only" broadcasts are ideal for grant announcements and policy shifts.
            </Text>
          </div>
        </Card>

        <Card className="glass-card border-amber-500/20 p-6 flex flex-col gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <Text variant="bodySmall" weight="bold">Alert Integrity</Text>
            <Text variant="caption" className="text-muted-foreground mt-1 leading-relaxed">
              Inactive notifications are stored in the archive for historical auditing but are invisible to all platform nodes.
            </Text>
          </div>
        </Card>
      </div>

      {/* Create/Edit Broadcast Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl bg-card border-white/10 p-0 overflow-hidden">
          <form onSubmit={handleSave}>
            <DialogHeader className="p-8 bg-primary/5 border-b border-white/5">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" /> 
                {currentNotif?.id ? 'Refine Broadcast' : 'Draft New Broadcast'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground pt-2">
                Configure the payload and targeting parameters for this announcement.
              </DialogDescription>
            </DialogHeader>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Broadcast Headline</Label>
                <Input 
                  value={currentNotif?.title || ''} 
                  onChange={(e) => setCurrentNotif(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="e.g. Q1 Research Grants Active" 
                  className="bg-background/50 border-white/5 h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Message Payload</Label>
                <Textarea 
                  value={currentNotif?.message || ''} 
                  onChange={(e) => setCurrentNotif(prev => prev ? { ...prev, message: e.target.value } : null)}
                  placeholder="Provide detailed context for the notification..." 
                  className="bg-background/50 border-white/5 min-h-[120px] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Engagement Type</Label>
                  <Select 
                    value={currentNotif?.type} 
                    onValueChange={(val) => setCurrentNotif(prev => prev ? { ...prev, type: val as SystemNotificationType } : null)}
                  >
                    <SelectTrigger className="bg-background/50 border-white/5 h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Information (Blue)</SelectItem>
                      <SelectItem value="success">Success (Emerald)</SelectItem>
                      <SelectItem value="warning">Warning (Amber)</SelectItem>
                      <SelectItem value="error">Critical (Red)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Audience Segment</Label>
                  <Select 
                    value={currentNotif?.target} 
                    onValueChange={(val) => setCurrentNotif(prev => prev ? { ...prev, target: val as SystemNotificationTarget } : null)}
                  >
                    <SelectTrigger className="bg-background/50 border-white/5 h-11">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Global (All Users)</SelectItem>
                      <SelectItem value="creators">Expert Creators Only</SelectItem>
                      <SelectItem value="admins">Administrative Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Active Broadcast</Label>
                  <p className="text-[10px] text-muted-foreground">Determine if this message is live across targeting nodes.</p>
                </div>
                <Switch 
                  checked={currentNotif?.active} 
                  onCheckedChange={(val) => setCurrentNotif(prev => prev ? { ...prev, active: val } : null)}
                />
              </div>
            </div>

            <DialogFooter className="p-8 bg-muted/20 border-t border-white/5 gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="h-12 px-8 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {currentNotif?.id ? 'Synchronize Broadcast' : 'Commit Broadcast'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
