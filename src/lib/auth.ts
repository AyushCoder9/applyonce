import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { profiles } from "@/db/schema";

export type Actor = {
  clerkUserId: string;
  email: string;
  fullName: string;
  phone: string | null;
};

export async function getActor(): Promise<Actor | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  )?.emailAddress;
  const fallbackEmail = user?.emailAddresses[0]?.emailAddress;

  return {
    clerkUserId: userId,
    email: primaryEmail ?? fallbackEmail ?? `${userId}@users.applyonce.local`,
    fullName:
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "ApplyOnce citizen",
    phone: user?.phoneNumbers[0]?.phoneNumber ?? null,
  };
}

export async function ensureActorProfile(actor: Actor) {
  const db = getDatabase();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.clerkUserId, actor.clerkUserId))
    .limit(1);

  if (existing[0]) {
    // Clerk is the identity authority, but the profile phone can also be
    // completed inside ApplyOnce. Never replace a citizen-entered value with
    // a missing phone number from the auth provider on the next read.
    const nextPhone = existing[0].phone ?? actor.phone;
    const identityChanged =
      existing[0].email !== actor.email ||
      existing[0].fullName !== actor.fullName ||
      existing[0].phone !== nextPhone;

    if (!identityChanged) {
      return existing[0];
    }

    const [updated] = await db
      .update(profiles)
      .set({
        email: actor.email,
        fullName: actor.fullName,
        phone: nextPhone,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existing[0].id))
      .returning();

    return updated ?? existing[0];
  }

  const [created] = await db
    .insert(profiles)
    .values({
      clerkUserId: actor.clerkUserId,
      email: actor.email,
      fullName: actor.fullName,
      phone: actor.phone,
    })
    .returning();

  return created;
}
