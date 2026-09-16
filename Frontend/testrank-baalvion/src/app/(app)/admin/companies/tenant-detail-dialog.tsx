
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Briefcase, FileText, Download, FileArchive } from 'lucide-react';
import type { AdminCompanyData } from './page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TenantDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tenant: AdminCompanyData | null;
}

export function TenantDetailDialog({ isOpen, onOpenChange, tenant }: TenantDetailDialogProps) {
  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={tenant.logoUrl} alt={tenant.name} />
              <AvatarFallback>{tenant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{tenant.name}</DialogTitle>
              <DialogDescription>
                Tenant ID: {tenant.id}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tenant.userCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tenant.taskCount}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Submissions</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{tenant.submissionCount}</div>
                </CardContent>
            </Card>
        </div>
        <div className="mt-4">
            <h4 className="font-medium mb-2">Verification Documents ({tenant.verificationDocs?.country || 'N/A'})</h4>
            {tenant.verificationDocs && tenant.verificationDocs.documents.length > 0 ? (
                 <div className="rounded-md border p-4 space-y-3">
                    {tenant.verificationDocs.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <FileArchive className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm font-medium">{doc.name}</span>
                            </div>
                            <Button asChild variant="ghost" size="sm">
                                <Link href={doc.url} download>
                                    <Download className="mr-2 h-4 w-4" /> Download
                                </Link>
                            </Button>
                        </div>
                    ))}
                 </div>
            ) : (
                <div className="rounded-md border p-4 text-sm text-muted-foreground text-center">
                    No verification documents submitted for this tenant.
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
