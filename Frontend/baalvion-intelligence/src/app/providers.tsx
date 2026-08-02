"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@baalvion/auth-sdk/react";

import { authSessionOptions } from "@/lib/auth/session";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider {...authSessionOptions}>{children}</AuthProvider>;
}
