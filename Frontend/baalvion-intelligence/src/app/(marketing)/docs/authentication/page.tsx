import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication",
  description: "How to authenticate requests to the Baalvion Intelligence News API with bearer tokens.",
};

const authHeaderExample = `Authorization: Bearer bvi_live_51H8x2K...`;

export default function AuthenticationPage() {
  return (
    <article className="max-w-none">
      <span className="eyebrow">Authentication</span>
      <h1>Authenticating requests</h1>
      <p>
        All requests must include an <code className="font-mono text-sm">Authorization</code>{" "}
        header with a bearer token. Keys are scoped to your account and plan quota.
      </p>

      <h2 className="mt-10 text-2xl">Header format</h2>
      <pre className="overflow-x-auto rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground/90">
        <code>{authHeaderExample}</code>
      </pre>

      <h2 className="mt-10 text-2xl">Key rotation</h2>
      <p>
        Revoke and regenerate keys anytime from{" "}
        <span className="font-medium text-foreground">Dashboard &rarr; API</span>. Revoked keys
        stop working immediately; requests already in flight are not interrupted.
      </p>

      <h2 className="mt-10 text-2xl">Rate limits</h2>
      <p>
        Every response includes <code className="font-mono text-sm">X-RateLimit-Remaining</code>{" "}
        and <code className="font-mono text-sm">X-RateLimit-Reset</code> headers so you can back off
        before hitting your quota.
      </p>
    </article>
  );
}
