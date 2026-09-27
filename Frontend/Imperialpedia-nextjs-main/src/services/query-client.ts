'use client'
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number(process.env.NEXT_PUBLIC_STALE_TIME) || 1000 * 60 * 5,
            gcTime: Number(process.env.NEXT_PUBLIC_GC_TIME) || 1000 * 60 * 10,
            retry: Number(process.env.NEXT_PUBLIC_RETRY) || 4,
            refetchOnWindowFocus: false,
        },
    },
});