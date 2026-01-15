import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/owner',
  '/products',
  '/onboard',
  '/api/auth/(.*)',
  '/api/products',
  '/api/customer/(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes and API routes to pass through
  // The app handles its own auth logic for owner vs customer
  if (isPublicRoute(req)) {
    return;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
