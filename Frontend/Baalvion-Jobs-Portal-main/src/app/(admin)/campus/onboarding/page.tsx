'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { onboardingService } from '@/services/onboarding.service';
import type {
  CollegeApplication,
  StudentApplication,
  ApplicationStatus,
} from '@/lib/server/onboarding-schemas';
import {
  Building2,
  GraduationCap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

type StatusFilter = ApplicationStatus | 'all';

const STATUS_BADGE: Record<ApplicationStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-300' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-300' },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function CampusOnboardingPage() {
  const { toast } = useToast();
  const [colleges, setColleges] = useState<CollegeApplication[]>([]);
  const [students, setStudents] = useState<StudentApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const [collegeData, studentData] = await Promise.all([
        onboardingService.listColleges(filter),
        onboardingService.listStudents(filter),
      ]);
      setColleges(collegeData);
      setStudents(studentData);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to load onboarding requests.' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecision = useCallback(
    async (
      collection: 'college' | 'student',
      id: string,
      status: Exclude<ApplicationStatus, 'pending'>,
    ) => {
      setBusyId(id);
      try {
        const ok = await onboardingService.updateStatus(collection, id, status);
        if (!ok) throw new Error('update failed');
        toast({
          title: status === 'approved' ? 'Application approved' : 'Application rejected',
          description: 'The applicant record has been updated.',
        });
        await load();
      } catch {
        toast({ variant: 'destructive', title: 'Could not update the application.' });
      } finally {
        setBusyId(null);
      }
    },
    [load, toast],
  );

  const pendingColleges = useMemo(
    () => colleges.filter((c) => c.status === 'pending').length,
    [colleges],
  );
  const pendingStudents = useMemo(
    () => students.filter((s) => s.status === 'pending').length,
    [students],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Requests</h1>
          <p className="text-muted-foreground">
            Review and approve colleges and students who applied to join the platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colleges" className="w-full">
        <TabsList>
          <TabsTrigger value="colleges" className="gap-2">
            <Building2 className="h-4 w-4" /> Colleges
            {pendingColleges > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingColleges}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <GraduationCap className="h-4 w-4" /> Students
            {pendingStudents > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingStudents}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Colleges */}
        <TabsContent value="colleges">
          <Card>
            <CardHeader>
              <CardTitle>College Applications</CardTitle>
              <CardDescription>
                Institutions that applied to onboard their placement cell.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : colleges.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No college applications {statusFilter !== 'all' ? `(${statusFilter})` : ''}{' '}
                        yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    colleges.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {c.institutionName}
                          <div className="text-xs text-muted-foreground">{c.referenceId}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.city}, {c.state}
                          <div className="text-xs text-muted-foreground">{c.country}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.contactName}
                          <div className="flex flex-col text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {c.contactEmail}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {c.contactPhone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{c.tier === 'unsure' ? '—' : `Type ${c.tier}`}</TableCell>
                        <TableCell className="text-sm">{formatDate(c.createdAt)}</TableCell>
                        <TableCell>
                          <StatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {c.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === c.id}
                                onClick={() => handleDecision('college', c.id, 'approved')}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === c.id}
                                onClick={() => handleDecision('college', c.id, 'rejected')}
                              >
                                <XCircle className="mr-1 h-4 w-4 text-red-600" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {formatDate(c.updatedAt)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students */}
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Applications</CardTitle>
              <CardDescription>Students who applied to join the talent network.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Grad. Year</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={7}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No student applications {statusFilter !== 'all' ? `(${statusFilter})` : ''}{' '}
                        yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">
                          {s.fullName}
                          <div className="flex flex-col text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {s.email}
                            </span>
                            <span>{s.referenceId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{s.collegeName}</TableCell>
                        <TableCell className="text-sm">
                          {s.course}
                          {s.branch ? <div className="text-xs text-muted-foreground">{s.branch}</div> : null}
                        </TableCell>
                        <TableCell className="text-sm">{s.graduationYear}</TableCell>
                        <TableCell className="text-sm capitalize">
                          {s.interest.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === s.id}
                                onClick={() => handleDecision('student', s.id, 'approved')}
                              >
                                <CheckCircle2 className="mr-1 h-4 w-4 text-emerald-600" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === s.id}
                                onClick={() => handleDecision('student', s.id, 'rejected')}
                              >
                                <XCircle className="mr-1 h-4 w-4 text-red-600" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {formatDate(s.updatedAt)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
