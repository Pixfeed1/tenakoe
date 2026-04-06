import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Routes admin uniquement
    const adminRoutes = ["/api/users", "/parametres", "/api/cron"];
    if (adminRoutes.some((r) => path.startsWith(r)) && token?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé — admin uniquement" }, { status: 403 });
    }

    // Prescripteurs : accès lecture limité
    if (token?.role === "PRESCRIPTEUR") {
      // Pages autorisées
      const allowedPages = ["/dashboard"];
      // API GET uniquement sur certaines routes
      const allowedAPIs = ["/api/prescripteur/mes-leads", "/api/auth", "/api/guide"];

      if (path.startsWith("/api/")) {
        // Prescripteurs ne peuvent que lire (GET)
        if (method !== "GET") {
          return NextResponse.json({ error: "Accès en lecture seule" }, { status: 403 });
        }
        if (!allowedAPIs.some((r) => path.startsWith(r))) {
          return NextResponse.json({ error: "Accès limité" }, { status: 403 });
        }
      } else {
        if (!allowedPages.some((r) => path.startsWith(r)) && path !== "/") {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  // Protect ALL pages and API routes except:
  // - /api/auth (NextAuth endpoints)
  // - /api/leads (public POST for prescripteur form — GET has its own auth check)
  // - /api/prescripteur-config (public GET for prescripteur form)
  // - /api/depot-config (public GET for prescripteur form)
  // - /api/webhooks (external webhook receivers)
  // - /_next, /favicon.ico, static assets
  matcher: [
    "/dashboard/:path*",
    "/contacts/:path*",
    "/entreprises/:path*",
    "/projets/:path*",
    "/parametres/:path*",
    "/api/((?!auth|leads|prescripteur-config|depot-config|webhooks).*)",
  ],
};
