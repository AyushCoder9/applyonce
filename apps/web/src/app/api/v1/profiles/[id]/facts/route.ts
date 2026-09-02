import { SECTIONS } from "@praman/schema";
import { handler, citizen, ok, ApiError } from "@/lib/api";
import { isSteppedUp } from "@/lib/session";
import { loadFacts } from "../../_lib";

/** GET ?section=&reveal=1 → facts (sensitive masked unless stepped-up + reveal). */
export const GET = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const url = new URL(req.url);
  const section = url.searchParams.get("section") ?? undefined;
  if (section && !(SECTIONS as readonly string[]).includes(section)) throw new ApiError(400, "BAD_SECTION");
  const reveal = url.searchParams.get("reveal") === "1";
  if (reveal && !isSteppedUp(a.session)) throw new ApiError(403, "STEP_UP_REQUIRED", "Confirm with your passkey or OTP to reveal");
  const facts = await loadFacts(a, { section, reveal });
  return ok({ facts, steppedUp: isSteppedUp(a.session), scope: a.scope });
});
