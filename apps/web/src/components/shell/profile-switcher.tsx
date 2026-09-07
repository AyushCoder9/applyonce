"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Dropdown, Avatar, Chip, toast } from "@heroui/react";
import { ChevronDown, Plus } from "lucide-react";

export type SwitchableProfile = { id: string; displayName: string; kind: "self" | "dependent"; role: "self" | "owner" | "guardian" };

export function ProfileSwitcher({ profiles, activeId }: { profiles: SwitchableProfile[]; activeId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const active = profiles.find((p) => p.id === activeId) ?? profiles[0];
  const pick = async (id: string) => {
    if (id === "add") return router.push("/app/family?add=1");
    if (id === activeId) return;
    setBusy(true);
    const r = await fetch("/api/v1/profiles/active", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profileId: id }) });
    setBusy(false);
    if (!r.ok) return toast.danger("Could not switch profile");
    const name = profiles.find((p) => p.id === id)?.displayName;
    toast.success(`Now viewing: ${name}`, { description: "Everything you do applies to this profile." });
    start(() => router.refresh());
  };
  if (!active) return null;
  return (
    <Dropdown>
      <Dropdown.Trigger className="flex items-center gap-2 rounded-pill border border-line bg-surface px-2 py-1 text-sm font-medium hover:bg-surface-2" aria-label="Switch profile">
        <Avatar size="sm" color={active.kind === "self" ? "accent" : "warning"}><Avatar.Fallback>{active.displayName.slice(0, 1)}</Avatar.Fallback></Avatar>
        <span className="hidden max-w-14 truncate min-[360px]:inline sm:max-w-28">{active.displayName}</span>
        {active.role === "guardian" && <Chip className="hidden sm:inline-flex" size="sm" color="warning" variant="soft">Guardian</Chip>}
        <ChevronDown className={`size-4 text-ink-3 ${busy || pending ? "animate-pulse" : ""}`} />
      </Dropdown.Trigger>
      <Dropdown.Popover>
        <Dropdown.Menu aria-label="Profiles" onAction={(k) => pick(String(k))}>
          {profiles.map((p) => (
            <Dropdown.Item key={p.id} id={p.id} textValue={p.displayName}>
              <span className="flex items-center gap-2">{p.displayName}{p.role === "guardian" && <Chip size="sm" color="warning" variant="soft">Guardian</Chip>}{p.id === activeId && <Dropdown.ItemIndicator />}</span>
            </Dropdown.Item>
          ))}
          <Dropdown.Item id="add" textValue="Add family member"><span className="flex items-center gap-2 text-brand-600"><Plus className="size-4" />Add family member</span></Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
