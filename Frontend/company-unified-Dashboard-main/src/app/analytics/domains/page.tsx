
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Globe, Lock, Users, BarChart, Clock, ShieldCheck, Server, CircleDollarSign } from 'lucide-react';
import domainsData from '@/lib/data/domains.json';

export default function DomainAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Domain Analytics</h1>
        <p className="text-muted-foreground">
          An overview of your web presence and performance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {domainsData.map((domain) => (
          <Card key={domain.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {domain.domain}
                </CardTitle>
                <Badge variant={domain.sslStatus === 'valid' ? 'default' : 'destructive'} className={domain.sslStatus === 'valid' ? 'bg-green-100 text-green-800' : ''}>
                  <Lock className="mr-1 h-3 w-3" />
                  SSL
                </Badge>
              </div>
              <CardDescription>{domain.businessName}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-bold">{domain.monthlyVisitors.toLocaleString()}</span> Visitors/mo</span>
              </div>
               <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-bold">{domain.pageViews.toLocaleString()}</span> Pageviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-bold">{domain.avgSessionDuration}</span> Avg. Session</span>
              </div>
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-bold">${domain.webRevenue.toLocaleString()}</span> Web Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-bold">{domain.uptime}%</span> Uptime</span>
              </div>
               <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span><span className="font-bold">${domain.hostingCost}/mo</span> Hosting</span>
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/analytics/domains/${domain.id}`} className="w-full">
                <Button variant="outline" className="w-full">
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
