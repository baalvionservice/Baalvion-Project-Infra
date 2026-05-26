import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CompanySignupForm } from './company-signup-form';
import Link from 'next/link';

export default function CompanySignupPage() {
  return (
    <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-10">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Create Your Company Account</CardTitle>
          <CardDescription>
            Hire talent based on real skills, not resumes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompanySignupForm />
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
