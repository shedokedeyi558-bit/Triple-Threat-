import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── MAINTENANCE MODE ──────────────────────────────────────────────────────
// Set to true to redirect all player-facing routes to /maintenance.
// Admin routes (/admin, /api/admin) remain fully accessible.
// To lift maintenance: set to false and redeploy.
const MAINTENANCE_MODE = false;

// Routes that are always accessible regardless of maintenance mode
const ALWAYS_ALLOW = [
  "/maintenance",   // the maintenance page itself
  "/admin",         // admin panel
  "/api/admin",     // admin API routes
  "/_next",         // Next.js internals
  "/favicon",       // favicons
  "/manifest",      // PWA manifest
  "/bitlyfe-mark",  // logo asset
  "/apple-touch",   // PWA icon
];

export function middleware(request: NextRequest) {
  if (!MAINTENANCE_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Allow all admin and system paths through
  const allowed = ALWAYS_ALLOW.some((prefix) => pathname.startsWith(prefix));
  if (allowed) return NextResponse.next();

  // Redirect everything else to maintenance page
  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.png|.*\\.svg|.*\\.ico|.*\\.webp).*)",
  ],
};
