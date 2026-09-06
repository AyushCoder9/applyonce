"use client";
import { Skeleton } from "@heroui/react";
export default function Loading() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading">
      <div className="grid gap-2"><Skeleton className="h-4 w-32 rounded-md" /><Skeleton className="h-10 w-72 rounded-md" /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>
    </div>
  );
}
