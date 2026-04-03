"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function Providers({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  useEffect(() => {
    let isMounted = true;

    Promise.resolve(useAuthStore.persist.rehydrate()).finally(() => {
      if (isMounted) {
        setReady(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-surface" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
