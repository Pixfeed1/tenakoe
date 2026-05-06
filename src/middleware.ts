import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const method = req.method;

    // Routes admin uniquement (sauf /api/users/me accessible à tous)
    const adminRoutes = ["/api/users"];
    if (adminRoutes.some((r) => path.startsWith(r)) && !path.startsWith("/api/users/me") && token?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé — admin uniquement" }, { status: 403 });
    }

    // Prescripteurs : accès lecture limité
    if (token?.role === "PRESCRIPTEUR") {
      // Pages autorisées
      const allowedPages = ["/dashboard", "/parametres"];
      // API GET uniquement sur certaines routes
      const allowedAPIs = ["/api/prescripteur/mes-leads", "/api/auth", "/api/guide", "/api/users/me", "/api/change-password"];

      if (path.startsWith("/api/")) {
        // Prescripteurs ne peuvent que lire (GET), sauf /api/users/me et /api/change-password
        if (method !== "GET" && !path.startsWith("/api/users/me") && !path.startsWith("/api/change-password")) {
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
  // Exclude /api/auth and /api/leads (public form submission) from auth
  matcher: ["/dashboard/:path*", "/api/((?!auth|leads|prescripteur-config|depot-config|cron).*)"],
};
