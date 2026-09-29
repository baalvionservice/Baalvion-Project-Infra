import { ErrorCode } from "@/types/api.types";

export const errorService = {
  createError: (code: ErrorCode, message: string) => ({
    code,
    message
  }),
  
  handleServiceError: (error: any) => {
    console.error("[Service Error]", error);
    return {
      code: 'UNKNOWN_ERROR' as ErrorCode,
      message: error.message || "An unexpected system error occurred."
    };
  }
};
