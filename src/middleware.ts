import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Routes admin uniquement
    const adminRoutes = ["/api/users", "/parametres"];
    if (adminRoutes.some((r) => path.startsWith(r)) && token?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Prescripteurs : accès limité
    if (token?.role === "PRESCRIPTEUR") {
      const allowed = ["/dashboard", "/api/entreprises", "/api/projets"];
      if (!allowed.some((r) => path.startsWith(r)) && path !== "/") {
        return NextResponse.json({ error: "Accès limité" }, { status: 403 });
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
  matcher: ["/dashboard/:path*", "/api/((?!auth).*)"],
};
