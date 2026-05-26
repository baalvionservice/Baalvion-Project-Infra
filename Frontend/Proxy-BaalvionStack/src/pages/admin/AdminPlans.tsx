import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Users,
  TrendingUp,
  MoreVertical,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { EnhancedPlan } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";
import { billingApi } from "@/lib/platformClient";
import { useQuery } from "@tanstack/react-query";

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

const overageLabels: Record<string, { label: string; variant: "destructive" | "warning" | "success" }> = {
  blocked: { label: "Blocked", variant: "destructive" },
  throttled: { label: "Throttled", variant: "warning" },
  "pay-as-you-go": { label: "Pay-as-you-go", variant: "success" },
};

export default function AdminPlans() {
  const { data: rawPlans = [] } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: billingApi.getPlans,
    staleTime: 120_000,
  });
  const { toast } = useToast();

  const plans: EnhancedPlan[] = rawPlans.map((p, idx) => ({
    id: parseInt(String(p.id)) || idx + 1,
    name: p.name,
    price: p.monthlyPrice,
    bandwidth: `${p.bandwidthLimitGb} GB`,
    activeUsers: 0,
    revenue: 0,
    allowedProxyTypes: Array.isArray(p.features) ? p.features : [],
    sessionLimit: 0,
    rotationRules: [],
    overageBehavior: "pay-as-you-go" as const,
  }));

  const totalRevenue = plans.reduce((sum, p) => sum + p.revenue, 0);
  const totalUsers = plans.reduce((sum, p) => sum + p.activeUsers, 0);

  const revenueByPlan = plans.map(plan => ({
    name: plan.name,
    value: plan.revenue,
    percentage: ((plan.revenue / totalRevenue) * 100).toFixed(1)
  }));

  const handleAction = (action: string, planName: string) => {
    toast({
      title: `${action} Plan`,
      description: `${action} performed on ${planName} plan`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Plans & Billing</h1>
          <p className="text-muted-foreground">Manage subscription plans, quotas, and rules.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="stats">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Monthly Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Subscribers</p>
                <p className="text-2xl font-bold">{totalUsers.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="stats">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Revenue/User</p>
                <p className="text-2xl font-bold">${(totalRevenue / totalUsers).toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={plans}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card variant="default">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByPlan}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ percentage }) => `${percentage}%`}
                    labelLine={false}
                  >
                    {revenueByPlan.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {revenueByPlan.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="ml-auto font-medium">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans Table with Rules */}
      <Card variant="default">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Subscription Plans & Quotas</CardTitle>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configure Rules
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead>Plan Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Bandwidth</TableHead>
                <TableHead>Proxy Types</TableHead>
                <TableHead>Session Limit</TableHead>
                <TableHead>Overage</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const overage = overageLabels[plan.overageBehavior];
                
                return (
                  <TableRow key={plan.id} className="border-border/50">
                    <TableCell>
                      <Badge variant={
                        plan.name === "Enterprise" ? "default" : 
                        plan.name === "Professional" ? "success" : 
                        plan.name === "Pay As You Go" ? "warning" : "muted"
                      }>
                        {plan.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {plan.name === "Pay As You Go" 
                        ? `$${plan.price}/GB` 
                        : `$${plan.price}/mo`}
                    </TableCell>
                    <TableCell>{plan.bandwidth}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-[150px]">
                        {plan.allowedProxyTypes.map((type) => (
                          <Badge key={type} variant="muted" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {plan.sessionLimit === -1 ? (
                        <span className="text-success">Unlimited</span>
                      ) : (
                        <span>{plan.sessionLimit}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={overage.variant}>{overage.label}</Badge>
                    </TableCell>
                    <TableCell>{plan.activeUsers.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAction("Edit", plan.name)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Plan
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("Configure", plan.name)}>
                            <Settings className="w-4 h-4 mr-2" />
                            Configure Quotas
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction("Delete", plan.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Plan
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rotation Rules Info */}
      <Card variant="glass">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Rotation Rules by Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 rounded-lg bg-secondary/30">
                <h4 className="font-medium mb-2">{plan.name}</h4>
                <div className="space-y-1">
                  {plan.rotationRules.map((rule, index) => (
                    <p key={index} className="text-sm text-muted-foreground">• {rule}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
