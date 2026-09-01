import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Authentication and authorization are enforced at each protected layout,
// route handler, and data-access boundary. The proxy only refreshes Clerk's
// request context; it does not use path matching as an authorization layer.
export default clerkMiddleware(async (_auth, request) => {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  if (request.nextUrl.pathname.startsWith("/api/") && isMutation) {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Cross-origin mutation rejected" }, { status: 403 });
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*|.well-known/workflow/).*)", "/api/(.*)"],
};
