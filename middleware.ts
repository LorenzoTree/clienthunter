import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Mark public routes (include the webhook!)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/clerk-webhook", // <-- allow Clerk to post without auth
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      return (await auth()).redirectToSignIn();
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
