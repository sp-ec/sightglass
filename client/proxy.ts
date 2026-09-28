import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Pages reachable without a session
const publicPaths = ["/login", "/signup", "/setup"];

// Optimistic gate only. The real boundary is requireAdmin on the Express API,
// which reads the role from the database. A user who edits the sa_role cookie
// can make this page render, and then every request it makes returns 403.
const adminPaths = ["/sync", "/admin"];

// Forwards the API to Express so the browser sees one origin, which keeps the
// session cookie first-party. Done here rather than as a next.config rewrite
// because those are frozen at build time; this reads SERVER_API_URL per request.
function rewriteToApi(request: NextRequest) {
	const apiOrigin = process.env.SERVER_API_URL ?? "http://localhost:3001";
	const { pathname, search } = request.nextUrl;
	return NextResponse.rewrite(new URL(`${pathname}${search}`, apiOrigin));
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Must come before the session gate, or an anonymous POST /api/auth/login
	// would be redirected to /login as HTML and signing in would be impossible
	if (pathname === "/api" || pathname.startsWith("/api/")) {
		return rewriteToApi(request);
	}

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

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico)$).*)",
	],
};
