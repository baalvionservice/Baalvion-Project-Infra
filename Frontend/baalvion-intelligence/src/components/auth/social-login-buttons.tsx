import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.54-5.17 3.54-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.88-3a7.13 7.13 0 0 1-10.6-3.76H1.46v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.46 14.34a7.2 7.2 0 0 1 0-4.68V6.57H1.46a12 12 0 0 0 0 10.86l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.6 11.6 0 0 0 12 0 12 12 0 0 0 1.46 6.57l4 3.09A7.13 7.13 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

type Props = {
  returnTo: string;
};

export function SocialLoginButtons({ returnTo }: Props) {
  return (
    <div className="space-y-3">
      <Button asChild variant="outline" className="w-full">
        <a href={`/auth-bff/oauth/google/start?returnTo=${encodeURIComponent(returnTo)}`}>
          <GoogleIcon />
          Continue with Google
        </a>
      </Button>
    </div>
  );
}
