import { apiClient } from "@/services/api-client";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "sonner";
import { ApiResponse } from "@/types/api";

interface MutationParams<TData, TResponse> {
  endpoint: string;
  invalidateTags?: string[] | string[][];
  id?: string;
  method: "post" | "patch" | "delete";
  data?: TData;
  config?: AxiosRequestConfig;
  toastOnError?: boolean;
  toastOnSuccess?: boolean;
  onSuccess?: (data: AxiosResponse<ApiResponse<TResponse>>) => void;
  onError?: (error: unknown) => void;
}

export const useAppMutation = <TData, TResponse>(): UseMutationResult<
  AxiosResponse<ApiResponse<TResponse>>,
  unknown,
  MutationParams<TData, TResponse>
> => {
  const axios = apiClient;

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ endpoint, method, data, config, id = "" }) => {
      const response = axios[method](
        `/${endpoint}${id ? `/${id}` : ""}`,
        data,
        config,
      );
      return response;
    },
    onError(error, variables) {
      if (error instanceof AxiosError) {
        if (variables.toastOnError ?? true) {
          // Handle ApiResponse error structure
          const apiError = error.response?.data as ApiResponse<any>;
          if (apiError && typeof apiError.message === "string") {
            toast.error(apiError.message);
          } else {
            toast.error(error.message);
          }
        }
      } else if (error instanceof Error) {
        (variables.toastOnError ?? true) && toast.error(`${error.message}`);
      }

      variables.onError?.(error);
      console.log(error);
    },
    onSuccess(data, variables) {
      if (variables.invalidateTags?.length) {
        if (variables.invalidateTags[0] instanceof Array) {
          for (const tag of variables.invalidateTags) {
            queryClient.invalidateQueries({
              queryKey: tag as string[],
            });
          }
        } else {
          queryClient.invalidateQueries({
            queryKey: variables.invalidateTags as string[],
          });
        }
      }

      variables.onSuccess?.(data);
      (variables.toastOnSuccess ?? true) &&
        toast.success(data.data.message || "Success!");
    },
  });
};
