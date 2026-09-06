"use client";
import { Alert } from "@heroui/react";
/** Never more than one per view. */
export function Callout({ tone = "info", title, children, action }: { tone?: "info" | "warning" | "danger" | "success"; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  const status = ({ info: "accent", warning: "warning", danger: "danger", success: "success" } as const)[tone];
  return (
    <Alert status={status} className="my-4"><Alert.Indicator /><Alert.Content><Alert.Title>{title}</Alert.Title>{children && <Alert.Description>{children}</Alert.Description>}{action && <div className="mt-2">{action}</div>}</Alert.Content></Alert>
  );
}
