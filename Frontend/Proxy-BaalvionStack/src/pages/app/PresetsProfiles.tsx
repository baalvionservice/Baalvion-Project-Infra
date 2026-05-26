import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Plus, Play, Trash2, Clock, Settings, Copy, Edit, Save, Globe, Smartphone, Server, Search, Loader2 } from "lucide-react";
import { usePresets, useCreatePreset, useUpdatePreset, useDeletePreset } from "@/hooks/usePlatform";
import { Preset } from "@/lib/platformClient";
import { SEOHead } from "@/components/SEOHead";
import { format } from "date-fns";

const typeIcon = (t?: string) => {
  if (!t) return Zap;
  const l = t.toLowerCase();
  if (l === "residential") return Globe;
  if (l === "mobile") return Smartphone;
  if (l === "datacenter") return Server;
  return Zap;
};

const EMPTY_PRESET: Partial<Preset> = { name: "", country: "US", type: "Residential", protocol: "HTTP/HTTPS", rotation: "Rotating" };

export default function PresetsProfiles() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Partial<Preset>>(EMPTY_PRESET);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: presetPage, isLoading } = usePresets();
  const createPreset = useCreatePreset();
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const presets = presetPage?.data ?? [];

  const filtered = presets.filter(p =>
    !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreate = () => {
    setEditingPreset(EMPTY_PRESET);
    setIsCreating(true);
    setEditOpen(true);
  };

  const openEdit = (preset: Preset) => {
    setEditingPreset({ ...preset });
    setIsCreating(false);
    setEditOpen(true);
  };

  const openClone = (preset: Preset) => {
    setEditingPreset({ ...preset, id: undefined, name: preset.name + " (Copy)" });
    setIsCreating(true);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!editingPreset.name?.trim()) return;
    if (isCreating) {
      await createPreset.mutateAsync(editingPreset);
    } else if (editingPreset.id) {
      await updatePreset.mutateAsync({ id: editingPreset.id, data: editingPreset });
    }
    setEditOpen(false);
    setEditingPreset(EMPTY_PRESET);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deletePreset.mutateAsync(confirmDelete);
    setConfirmDelete(null);
  };

  const isPending = createPreset.isPending || updatePreset.isPending;

  return (
    <div className="space-y-6">
      <SEOHead title="Presets & Profiles" description="Quick-start proxy configurations and saved setup profiles for fast deployment." />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Presets & Profiles</h1>
          <p className="text-muted-foreground">Quick-start configurations and saved setups.</p>
        </div>
        <Button variant="hero" size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Create Preset
        </Button>
      </div>

      {/* Preset Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Saved Presets
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search presets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>{searchTerm ? "No presets match your search." : "No presets yet. Create your first preset!"}</p>
              {!searchTerm && (
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-2" /> Create Preset
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filtered.map(preset => {
              const Icon = typeIcon(preset.type);
              return (
                <Card key={preset.id} variant="interactive" className="group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Use preset" onClick={() => {}}>
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(preset)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Clone" onClick={() => openClone(preset)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-2">{preset.name}</h3>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {preset.type && (
                        <div className="flex items-center justify-between">
                          <span>Type</span>
                          <Badge variant="muted" className="capitalize">{preset.type}</Badge>
                        </div>
                      )}
                      {preset.country && (
                        <div className="flex items-center justify-between">
                          <span>Country</span>
                          <span>{preset.country}</span>
                        </div>
                      )}
                      {preset.rotation && (
                        <div className="flex items-center justify-between">
                          <span>Rotation</span>
                          <span>{preset.rotation}</span>
                        </div>
                      )}
                      {preset.protocol && (
                        <div className="flex items-center justify-between">
                          <span>Protocol</span>
                          <span>{preset.protocol}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
                      <Clock className="w-3 h-3" />
                      {format(new Date(preset.createdAt), "MMM d, yyyy")}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1" size="sm">
                        <Play className="w-4 h-4 mr-2" /> Use
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(preset.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create New Profile Form */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Quick Create
          </CardTitle>
          <CardDescription>Create a new preset configuration in one click.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preset Name</label>
              <Input placeholder="e.g., SEO Campaign Q1" className="bg-secondary/50" id="quick-name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Proxy Type</label>
              <Input placeholder="Residential" className="bg-secondary/50" id="quick-type" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Input placeholder="US" className="bg-secondary/50" id="quick-country" />
            </div>
            <div className="flex items-end">
              <Button
                variant="hero"
                className="w-full"
                onClick={() => {
                  const name = (document.getElementById("quick-name") as HTMLInputElement)?.value;
                  const type = (document.getElementById("quick-type") as HTMLInputElement)?.value;
                  const country = (document.getElementById("quick-country") as HTMLInputElement)?.value;
                  if (!name.trim()) return;
                  createPreset.mutate({ name, type: type || "Residential", country: country || "US", rotation: "Rotating", protocol: "HTTP/HTTPS" });
                }}
                disabled={createPreset.isPending}
              >
                {createPreset.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Preset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit / Create Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create Preset" : "Edit Preset"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preset Name</Label>
              <Input
                value={editingPreset.name ?? ""}
                onChange={e => setEditingPreset({ ...editingPreset, name: e.target.value })}
                placeholder="My Preset"
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Proxy Type</Label>
              <Select value={editingPreset.type ?? "Residential"} onValueChange={v => setEditingPreset({ ...editingPreset, type: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Residential">Residential</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Datacenter">Datacenter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={editingPreset.country ?? "US"} onValueChange={v => setEditingPreset({ ...editingPreset, country: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="Multi">Multi-country</SelectItem>
                  <SelectItem value="Auto">Auto-select</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rotation</Label>
              <Select value={editingPreset.rotation ?? "Rotating"} onValueChange={v => setEditingPreset({ ...editingPreset, rotation: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rotating">Rotating</SelectItem>
                  <SelectItem value="Rotating Fast">Rotating Fast</SelectItem>
                  <SelectItem value="Sticky 5min">Sticky 5min</SelectItem>
                  <SelectItem value="Sticky 10min">Sticky 10min</SelectItem>
                  <SelectItem value="Sticky 30min">Sticky 30min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Protocol</Label>
              <Select value={editingPreset.protocol ?? "HTTP/HTTPS"} onValueChange={v => setEditingPreset({ ...editingPreset, protocol: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HTTP/HTTPS">HTTP/HTTPS</SelectItem>
                  <SelectItem value="SOCKS5">SOCKS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending || !editingPreset.name?.trim()}>
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isCreating ? "Create Preset" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>This preset configuration will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
              disabled={deletePreset.isPending}
            >
              {deletePreset.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
