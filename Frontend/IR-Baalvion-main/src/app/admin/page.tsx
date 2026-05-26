import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Area | Baalvion',
  description: 'Administrative tools and dashboards for Baalvion.',
};

export default function AdminLandingPage() {
  return (
    <main className="flex-grow bg-muted/20 py-12">
      <div className="container mx-auto px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
             <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                <Shield className="h-8 w-8 text-primary"/>
            </div>
            <CardTitle className="mt-4">Admin Control Center</CardTitle>
            <CardDescription>This is a restricted area. Please select a dashboard to proceed.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild size="lg">
              <Link href="/admin/dashboard">Go to Main Dashboard</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Return to Public Site</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
