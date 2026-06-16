import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { CandidateSignupForm } from './candidate-signup-form';

export default function CandidateSignupPage() {
  return (
    <AuthShell
      variant="candidate"
      title="Create your candidate account"
      subtitle="Show what you can build. Get hired on what you can do."
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
      <CandidateSignupForm />
    </AuthShell>
  );
}
