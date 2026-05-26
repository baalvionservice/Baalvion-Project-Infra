'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="container flex h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Join SkillMatch Pro</CardTitle>
          <CardDescription>
            Choose your path. Are you here to prove your skills or find the best talent?
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Button variant="outline" className="h-24 w-full flex-col gap-2" asChild>
            <Link href="/signup/candidate">
              <User className="h-8 w-8" />
              <span>I'm a Candidate</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-24 w-full flex-col gap-2" asChild>
            <Link href="/signup/company">
              <Briefcase className="h-8 w-8" />
              <span>I'm a Company</span>
            </Link>
          </Button>
        </CardContent>
         <div className="p-6 pt-0 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
      </Card>
    </div>
  );
}
