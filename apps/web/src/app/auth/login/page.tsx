import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Log in" };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string }> }) {
  const { next, mode } = await searchParams;
  if (await getSession()) redirect(next ?? "/app");
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3"><img src="/icon.svg" alt="" className="size-10 rounded-xl" /><div><div className="font-display text-2xl font-bold">ApplyOnce</div><div className="text-sm text-ink-2">Verify once. Apply anywhere.</div></div></div>
        <LoginForm next={next ?? "/app"} mode={mode === "register" ? "register" : "login"} mock={(process.env.PROVIDER_SMS ?? "mock") === "mock"} />
      </div>
    </main>
  );
}
