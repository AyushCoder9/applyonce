import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/api/me(.*)",
  "/api/applications(.*)",
  "/api/profile(.*)",
  "/api/consents(.*)",
  "/api/documents(.*)",
  "/api/sources(.*)",
  "/api/partner(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)"],
};
