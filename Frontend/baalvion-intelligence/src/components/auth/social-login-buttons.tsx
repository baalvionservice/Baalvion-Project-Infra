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

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="#5865F2">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.45.86-.61 1.25a18.3 18.3 0 0 0-5.48 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04c-1.7.3-3.34.8-4.89 1.52a.07.07 0 0 0-.03.03C.53 8.63-.32 12.75.1 16.83a.08.08 0 0 0 .03.06 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.23-2a.08.08 0 0 0-.04-.11 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1 0-.13c.13-.09.25-.19.37-.28a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.28a.08.08 0 0 1 0 .13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.36.7.78 1.37 1.23 2a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.01-3.03.08.08 0 0 0 .03-.06c.5-4.72-.84-8.8-3.55-12.43a.06.06 0 0 0-.03-.03ZM8.02 14.4c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

type Props = {
  returnTo: string;
};

export function SocialLoginButtons({ returnTo }: Props) {
  const encodedReturnTo = encodeURIComponent(returnTo);
  return (
    <div className="space-y-3">
      <Button asChild variant="outline" className="w-full">
        <a href={`/auth-bff/oauth/google/start?returnTo=${encodedReturnTo}`}>
          <GoogleIcon />
          Continue with Google
        </a>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <a href={`/auth-bff/oauth/discord/start?returnTo=${encodedReturnTo}`}>
          <DiscordIcon />
          Continue with Discord
        </a>
      </Button>
    </div>
  );
}
