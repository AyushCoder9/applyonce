"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider, RouterProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } }));
  const router = useRouter();
  return (
    <QueryClientProvider client={qc}>
      <RouterProvider navigate={(href) => router.push(String(href))}>
        {children}
        <ToastProvider placement="top end" />
      </RouterProvider>
    </QueryClientProvider>
  );
}
