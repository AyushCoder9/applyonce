import { SECTIONS } from "@applyonce/schema";
import { handler, citizen, ok, ApiError } from "@/lib/api";
import { isSteppedUp, scopeAllows } from "@/lib/session";
import { loadFacts } from "../../_lib";

/** GET ?section=&reveal=1 → facts (sensitive masked unless stepped-up + reveal). */
export const GET = handler(async (req, { params }) => {
  const a = await citizen(req, { profileId: params.id });
  const url = new URL(req.url);
  const section = url.searchParams.get("section") ?? undefined;
  if (section && !(SECTIONS as readonly string[]).includes(section)) throw new ApiError(400, "BAD_SECTION");
  if(section && !scopeAllows(a.scope,section)) throw new ApiError(403,"SCOPE_FORBIDDEN","This section is outside your delegated access.");
  const reveal = url.searchParams.get("reveal") === "1";
  if (reveal && !isSteppedUp(a.session)) throw new ApiError(403, "STEP_UP_REQUIRED", "Confirm with your passkey or OTP to reveal");
  const facts = await loadFacts(a, { section, reveal });
  return ok({ facts, steppedUp: isSteppedUp(a.session), scope: a.scope });
});
