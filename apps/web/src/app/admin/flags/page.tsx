import { db, t, asc } from "@praman/db";
import { PageHeader } from "@praman/ui";
import { FlagToggle, NewFlag } from "@/components/admin/actions";
export const dynamic = "force-dynamic";
export default async function FlagsAdmin() {
  const rows = await db.select().from(t.flags).orderBy(asc(t.flags.key));
  return (
    <>
      <PageHeader title="Feature flags" subtitle="Global on/off. Rollout JSON is reserved for percentage/cohort rules." actions={<NewFlag />} />
      <ul className="card divide-y divide-line">{rows.map((f) => <li key={f.key} className="flex items-center justify-between px-4 py-3"><div><code className="font-medium">{f.key}</code>{f.rollout && Object.keys(f.rollout).length > 0 && <div className="text-xs text-ink-3">{JSON.stringify(f.rollout)}</div>}</div><FlagToggle flagKey={f.key} enabled={f.enabled} /></li>)}{rows.length === 0 && <li className="px-4 py-6 text-center text-ink-2">No flags yet.</li>}</ul>
    </>
  );
}
