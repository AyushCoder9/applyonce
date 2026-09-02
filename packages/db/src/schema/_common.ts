import { customType, timestamp, uuid } from "drizzle-orm/pg-core";

export const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });
export const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
export const id = () => uuid("id").primaryKey().defaultRandom();
export const createdAt = () => ts("created_at").notNull().defaultNow();
export const updatedAt = () => ts("updated_at").notNull().defaultNow().$onUpdate(() => new Date());
