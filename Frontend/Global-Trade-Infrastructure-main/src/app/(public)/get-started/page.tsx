import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, LogIn, ShoppingCart } from 'lucide-react';
import { PATHS } from '@/lib/paths';

export const metadata: Metadata = {
  title: 'Get started | Baalvion',
  description:
    'Create a buyer or seller account, request institutional access, or sign in. Pick the option that describes you.',
  alternates: { canonical: PATHS.GET_STARTED },
};

const CHOICES = [
  {
    icon: ShoppingCart,
    title: 'I want to buy or sell goods',
    body: 'Create your account. It takes a few minutes.',
    action: 'Create account',
    href: PATHS.REGISTER,
    primary: true,
  },
  {
    icon: Building2,
    title: 'I represent a bank, insurer, customs body, logistics company or regulator',
    body: 'Institutions are verified before access is granted.',
    action: 'Request access',
    href: PATHS.ACCESS_REQUEST,
    primary: false,
  },
  {
    icon: LogIn,
    title: 'I already have an account',
    body: 'Sign in and go straight to your console.',
    action: 'Sign in',
    href: PATHS.LOGIN,
    primary: false,
  },
] as const;

export default function GetStartedPage() {
  return (
    <div className="container max-w-3xl py-16 md:py-24 space-y-10">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-[0.95]">
          How will you use Baalvion?
        </h1>
        <p className="text-muted-foreground font-medium">Pick one.</p>
      </div>

      <div className="grid gap-4">
        {CHOICES.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group flex items-center gap-5 rounded-2xl border-2 p-6 md:p-8 transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none"
          >
            <c.icon className="h-8 w-8 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg md:text-xl font-black leading-tight">{c.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{c.body}</span>
            </span>
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-xs font-black uppercase tracking-widest ${
                c.primary ? 'bg-primary text-primary-foreground' : 'border-2'
              }`}
            >
              {c.action} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Not sure yet? <Link href={PATHS.PLATFORM} className="font-bold text-primary hover:underline">See how the platform works</Link>.
      </p>
    </div>
  );
}
