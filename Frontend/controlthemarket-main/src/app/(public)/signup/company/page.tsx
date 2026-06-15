import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { CompanySignupForm } from './company-signup-form';

export default function CompanySignupPage() {
  return (
    <AuthShell
      variant="company"
      title="Create your company account"
      subtitle="Hire on proven skill, not résumés."
      backHref="/signup"
      backLabel="Choose a different path"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <CompanySignupForm />
    </AuthShell>
  );
}
