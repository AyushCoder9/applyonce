import { NextResponse } from "next/server";
import { handler } from "@/lib/api";
import { publicJwks } from "@/lib/signing";

/** Public ES256 keys partners verify payload JWS against. Safe to cache. */
export const GET = handler(async () => NextResponse.json(await publicJwks(), { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" } }));
