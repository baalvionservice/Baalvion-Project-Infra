'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from '@/contexts/auth-context';
import { ProfileForm } from './profile-form';
import { Loader2 } from 'lucide-react';

export default function CandidateProfilePage() {
  const { user, updateUser, loading } = useAuth();

  if (loading || !user) {
    return (
        <div className="flex h-full w-full items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">
          My Profile
        </h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            This information will be visible to companies on your public profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} onUpdate={updateUser} />
        </CardContent>
      </Card>
    </div>
  );
}
