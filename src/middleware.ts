import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-greennest-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-greennest-search", request.nextUrl.search);
  requestHeaders.delete("x-greennest-scope-id");

  const scopeId = request.nextUrl.searchParams.get("scopeId");

  if (scopeId) {
    requestHeaders.set("x-greennest-scope-id", scopeId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
