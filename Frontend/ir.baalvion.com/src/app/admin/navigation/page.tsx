"use client";

import { useEffect, useState } from "react";
import { navigationService } from "@/core/services/navigation.service";
import { NavigationItem } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  GripVertical
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function NavigationManagerPage() {
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadNav = async () => {
    setIsLoading(true);
    const data = await navigationService.getAllItems();
    setItems(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNav();
    window.addEventListener('navigation-updated', loadNav);
    return () => window.removeEventListener('navigation-updated', loadNav);
  }, []);

  const handleToggleActive = async (item: NavigationItem) => {
    await navigationService.updateItem(item.id, { isActive: !item.isActive });
    toast({ title: "Status Updated", description: `${item.label} is now ${!item.isActive ? 'active' : 'inactive'}.` });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This will delete all subcategories too.")) {
      await navigationService.deleteItem(id);
      toast({ title: "Item Deleted" });
    }
  };

  const renderItem = (item: NavigationItem, depth = 0) => (
    <div key={item.id} className="space-y-2">
      <div className={cn(
        "flex items-center gap-4 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors group",
        !item.isActive && "opacity-50 grayscale"
      )} style={{ marginLeft: `${depth * 2}rem` }}>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 flex items-center gap-3">
          {item.children && item.children.length > 0 ? <ChevronDown size={16}/> : <div className="w-4"/>}
          <span className="font-medium">{item.label}</span>
          {item.href && <Badge variant="secondary" className="text-[10px]">{item.href}</Badge>}
          <div className="flex gap-1">
            {item.roles.map(r => (
              <Badge key={r} variant="outline" className="text-[8px] px-1 h-4">{r}</Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Active</span>
            <Switch checked={item.isActive} onCheckedChange={() => handleToggleActive(item)} />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      {item.children?.map(child => renderItem(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Navigation Manager</h1>
          <p className="text-muted-foreground">Manage header, footer, and role-based menu structures.</p>
        </div>
        <Button onClick={() => toast({ title: "Mock", description: "Add logic triggered" })}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Main Navigation Tree</CardTitle>
          <CardDescription>Drag and drop items to reorder. Changes reflect in real-time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground">Loading navigation architecture...</div>
          ) : (
            items.map(item => renderItem(item))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
