import { auth } from "@clerk/nextjs/server";

function configuredOperatorIds() {
  return new Set(
    (process.env.APPLYONCE_OPS_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isPlatformOperator(userId: string) {
  return configuredOperatorIds().has(userId);
}

export async function getPlatformOperator() {
  const { userId } = await auth();
  if (!userId || !isPlatformOperator(userId)) return null;
  return { userId };
}
