import { NextRequest, NextResponse } from "next/server";

const roleAccessMap: Record<string, Array<"admin" | "super-admin">> = {
  "/": ["admin", "super-admin"],
  "/dashboard": ["super-admin"],
};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const allowedRoles = roleAccessMap[pathname];
  if (!allowedRoles) {
    return NextResponse.next();
  }

  const role = request.cookies.get("role")?.value;
  const isAuthenticated = Boolean(role);

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (role && allowedRoles.includes(role as "admin" | "super-admin")) {
    return NextResponse.next();
  }

  const unauthorizedUrl = new URL("/unauthorized", request.url);
  unauthorizedUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(unauthorizedUrl);
}

export const config = {
  matcher: ["/", "/dashboard"],
};

