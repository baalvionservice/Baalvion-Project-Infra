import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  ArrowUp,
  ArrowDown,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Settings,
} from "lucide-react";
import { Supplier } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { useAdminProviders } from "@/hooks/useAdmin";

const statusConfig: Record<string, { variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle }> = {
  healthy: { variant: "success", icon: CheckCircle },
  degraded: { variant: "warning", icon: AlertTriangle },
  down: { variant: "destructive", icon: XCircle },
};

export default function AdminSupplierRouting() {
  const { data: rawProviders = [] } = useAdminProviders();
  const initialSuppliers: Supplier[] = rawProviders.map((p, idx) => ({
    id: String(p.id),
    name: p.name,
    priority: idx + 1,
    status: (p.status as Supplier["status"]) ?? "healthy",
    failoverEnabled: true,
    avgLatency: p.latency ?? 0,
    successRate: p.successRate ?? 100,
    supportedTypes: [p.type ?? "residential"],
  }));

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const { toast } = useToast();

  useEffect(() => { if (initialSuppliers.length > 0 && suppliers.length === 0) setSuppliers(initialSuppliers); }, [rawProviders]);

  const movePriority = (supplierId: string, direction: "up" | "down") => {
    const currentIndex = suppliers.findIndex((s) => s.id === supplierId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === suppliers.length - 1)
    ) {
      return;
    }

    const newSuppliers = [...suppliers];
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    // Swap priorities
    const tempPriority = newSuppliers[currentIndex].priority;
    newSuppliers[currentIndex].priority = newSuppliers[swapIndex].priority;
    newSuppliers[swapIndex].priority = tempPriority;
    
    // Swap positions
    [newSuppliers[currentIndex], newSuppliers[swapIndex]] = [newSuppliers[swapIndex], newSuppliers[currentIndex]];
    
    setSuppliers(newSuppliers);
    toast({
      title: "Priority Updated",
      description: `${suppliers[currentIndex].name} moved ${direction}`,
    });
  };

  const toggleFailover = (supplierId: string) => {
    setSuppliers(suppliers.map((s) =>
      s.id === supplierId ? { ...s, failoverEnabled: !s.failoverEnabled } : s
    ));
    const supplier = suppliers.find((s) => s.id === supplierId);
    toast({
      title: "Failover Updated",
      description: `${supplier?.name} failover ${supplier?.failoverEnabled ? "disabled" : "enabled"}`,
    });
  };

  const healthyCount = suppliers.filter((s) => s.status === "healthy").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Supplier Routing</h1>
          <p className="text-muted-foreground">Configure supplier priorities and failover behavior.</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Routing Settings
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{suppliers.length}</p>
            <p className="text-xs text-muted-foreground">Total Suppliers</p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-success">{healthyCount}</p>
            <p className="text-xs text-muted-foreground">Healthy</p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{suppliers.filter((s) => s.failoverEnabled).length}</p>
            <p className="text-xs text-muted-foreground">Failover Enabled</p>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">
              {Math.round(
                suppliers.filter((s) => s.status !== "down").reduce((sum, s) => sum + s.avgLatency, 0) /
                  suppliers.filter((s) => s.status !== "down").length
              )}ms
            </p>
            <p className="text-xs text-muted-foreground">Avg Latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Routing Table */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Supplier Priority Order</CardTitle>
            <p className="text-xs text-muted-foreground">Drag or use arrows to reorder</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="w-[80px]">Priority</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Proxy Types</TableHead>
                <TableHead>Failover</TableHead>
                <TableHead className="text-right">Reorder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier, index) => {
                const status = statusConfig[supplier.status];
                const StatusIcon = status.icon;

                return (
                  <TableRow key={supplier.id} className="border-border/50">
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        #{supplier.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Server className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{supplier.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant} className="gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {supplier.status === "down" ? "—" : `${supplier.avgLatency}ms`}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          supplier.status === "down"
                            ? "text-muted-foreground"
                            : supplier.successRate >= 98
                            ? "text-success"
                            : "text-warning"
                        }
                      >
                        {supplier.status === "down" ? "—" : `${supplier.successRate}%`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {supplier.supportedTypes.map((type) => (
                          <Badge key={type} variant="muted" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={supplier.failoverEnabled}
                        onCheckedChange={() => toggleFailover(supplier.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === 0}
                          onClick={() => movePriority(supplier.id, "up")}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={index === suppliers.length - 1}
                          onClick={() => movePriority(supplier.id, "down")}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card variant="glass">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">How Routing Works</h4>
              <p className="text-sm text-muted-foreground">
                Requests are routed to suppliers based on priority order. If a supplier is down or degraded,
                traffic automatically fails over to the next available supplier with failover enabled.
                Higher priority suppliers are preferred when healthy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
