
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Bell, Check, Users, Settings, Zap } from 'lucide-react';
import { useState } from 'react';

interface MonetizationData {
  subscription_plans: {
    plan: string;
    users: number | string;
    features: string[];
    price: number | string;
    billing: string[];
  }[];
  current_subscription: {
    company: string;
    current_plan: string;
    active_users: number;
    features_enabled: string[];
    billing_cycle: string;
    next_renewal: string;
  };
  alerts: string[];
}

interface MonetizationDashboardProps {
  data: MonetizationData;
}

export function MonetizationDashboard({ data }: MonetizationDashboardProps) {
  const [isYearly, setIsYearly] = useState(false);
  const { current_subscription, subscription_plans } = data;
  const currentPlanDetails = subscription_plans.find(p => p.plan === current_subscription.current_plan);
  const userLimit = typeof currentPlanDetails?.users === 'number' ? currentPlanDetails.users : 100;
  const userUsagePercentage = Math.round((current_subscription.active_users / userLimit) * 100);

  return (
    <div className="space-y-8 mt-8">
      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Choose the plan that fits your team's needs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Top Features</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscription_plans.map((plan) => (
                <TableRow key={plan.plan}>
                  <TableCell className="font-medium">{plan.plan}</TableCell>
                  <TableCell>{plan.users}</TableCell>
                  <TableCell>{plan.features.slice(0, 3).join(', ')}</TableCell>
                  <TableCell>
                    {typeof plan.price === 'number' ? `$${plan.price}/mo` : plan.price}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant={plan.plan === current_subscription.current_plan ? 'default' : 'outline'}>
                      {plan.plan === current_subscription.current_plan ? 'Current Plan' : 'Select Plan'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Current Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>
                Your company, <strong>{current_subscription.company}</strong>, is currently on the <strong>{current_subscription.current_plan}</strong> plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                       <span className="font-medium text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" /> Active Users</span>
                       <span><strong>{current_subscription.active_users}</strong> / {userLimit}</span>
                   </div>
                   <Progress value={userUsagePercentage} />
               </div>
               <div className="space-y-2">
                   <p className="font-medium text-muted-foreground text-sm flex items-center gap-2"><Settings className="h-4 w-4" /> Enabled Features</p>
                   <div className="flex flex-wrap gap-2">
                       {current_subscription.features_enabled.map(feature => (
                           <Badge key={feature} variant="secondary">{feature}</Badge>
                       ))}
                   </div>
               </div>
            </CardContent>
            <CardFooter className="justify-between items-center">
                 <p className="text-sm text-muted-foreground">
                    Next renewal: <strong>{current_subscription.next_renewal}</strong> ({current_subscription.billing_cycle})
                </p>
                <Button variant="outline">Manage Billing</Button>
            </CardFooter>
          </Card>
          
          {/* Mock API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" />Mock API Endpoints</CardTitle>
              <CardDescription>This demo is powered by the following mock API endpoints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs font-mono bg-muted p-4 rounded-md">
                <p><span className="font-bold text-green-600">GET</span> /api/corporates/subscription_plans</p>
                <p><span className="font-bold text-green-600">GET</span> /api/corporates/&#123;company_id&#125;/current_subscription</p>
                <p><span className="font-bold text-blue-600">POST</span> /api/corporates/&#123;company_id&#125;/change_subscription</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" />Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.alerts.map((alertMsg, index) => (
              <div key={index} className="flex items-start gap-3 rounded-md border p-3">
                <Check className="h-5 w-5 text-primary mt-1" />
                <p className="text-sm text-muted-foreground">{alertMsg}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
