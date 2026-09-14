import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages reachable without a session
const publicPaths = ["/login", "/signup", "/setup"];

// Optimistic gate only. The real boundary is requireAdmin on the Express API,
// which reads the role from the database. A user who edits the sa_role cookie
// can make this page render, and then every request it makes returns 403.
const adminPaths = ["/sync"];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;
	const hasSession = request.cookies.has("sa_session");
	const isPublic = publicPaths.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`),
	);

	if (!hasSession && !isPublic) {
		const target = new URL("/login", request.url);
		target.searchParams.set("next", pathname);
		return NextResponse.redirect(target);
	}

	if (hasSession && isPublic) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	if (
		hasSession &&
		adminPaths.some((path) => pathname.startsWith(path)) &&
		request.cookies.get("sa_role")?.value !== "admin"
	) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	return NextResponse.next();
}

// Excluding `api` is load-bearing: the proxy runs before the /api rewrite, so
// without it an anonymous POST /api/auth/login would be redirected to /login
// as HTML and signing in would be impossible.
export const config = {
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico)$).*)",
	],
};
