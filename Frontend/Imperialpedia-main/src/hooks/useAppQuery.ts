import { apiClient } from "@/services/api-client";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { AxiosError, AxiosRequestConfig } from "axios";
import { ApiResponse } from "@/types/api";

interface QueryParams {
  endpoint: string;
  queryKey: string[];
  config?: AxiosRequestConfig;
  enabled?: boolean;
  returnRawData?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

export const useAppQuery = <TResponse>({
  endpoint,
  queryKey,
  config,
  enabled = true,
  returnRawData = false,
  refetchInterval,
  staleTime,
  refetchOnWindowFocus,
}: QueryParams): UseQueryResult<
  TResponse | ApiResponse<TResponse>,
  AxiosError
> => {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<TResponse | ApiResponse<TResponse>>(
        `/${endpoint}`,
        config,
      );
      return returnRawData ? response.data : response.data;
    },
    enabled,
    ...(refetchInterval !== undefined && { refetchInterval }),
    ...(staleTime !== undefined && { staleTime }),
    ...(refetchOnWindowFocus !== undefined && { refetchOnWindowFocus }),
  });
};
