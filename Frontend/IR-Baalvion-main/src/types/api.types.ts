export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: ErrorCode;
    message: string;
  };
  meta: {
    timestamp: number;
    requestId: string;
    environment: string;
  };
}

export type ErrorCode = 
  | 'PERMISSION_DENIED'
  | 'ENTITY_NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN_ERROR'
  | 'STORAGE_UNAVAILABLE';
