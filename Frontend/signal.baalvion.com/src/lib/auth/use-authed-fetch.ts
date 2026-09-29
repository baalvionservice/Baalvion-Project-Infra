"use client";

import { useCallback } from "react";
import { useAuthSDK } from "@baalvion/auth-sdk/react";

import { getAccessToken } from "@/lib/auth/session";

interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

/** Bearer-auth fetch against this app's own /api/* route handlers, with one 401->refresh->retry. */
export function useAuthedFetch() {
  const { refresh } = useAuthSDK();

  return useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const attempt = async (): Promise<Response> =>
        fetch(path, { ...init, headers: { ...(init?.headers ?? {}), authorization: `Bearer ${getAccessToken() ?? ""}` } });

      let response = await attempt();
      if (response.status === 401) {
        await refresh();
        response = await attempt();
      }
      const body: ApiResult<T> = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Request failed");
      return body.data as T;
    },
    [refresh]
  );
}
