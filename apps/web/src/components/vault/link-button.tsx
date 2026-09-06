"use client";
import Link from "next/link";
import { buttonVariants } from "@heroui/react";
/** A Next <Link> styled as a HeroUI Button (HeroUI's `render` wants a function; this is simpler for plain navigation). */
export function LinkButton({ href, variant = "primary", size = "md", className, children, external, ...rest }: { href: string; variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger" | "danger-soft"; size?: "sm" | "md" | "lg"; className?: string; children: React.ReactNode; external?: boolean } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">) {
  const cls = buttonVariants({ variant, size, className });
  return external ? <a href={href} className={cls} {...rest}>{children}</a> : <Link href={href} className={cls} {...rest}>{children}</Link>;
}
