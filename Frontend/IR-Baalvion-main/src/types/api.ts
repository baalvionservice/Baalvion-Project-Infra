import { UserRole, ModuleName, ActionType } from "@/core/content/schemas";

export interface ApiMetadata {
  timestamp: string;
  requestId: string;
  environment: string;
  version: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: ApiMetadata;
}

export type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

export interface HookResponse<T> {
  data: T | null;
  status: FetchStatus;
  error: string | null;
  refresh: () => Promise<void>;
}
