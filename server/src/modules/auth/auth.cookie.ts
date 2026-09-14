import { Request, Response } from "express";
import {
	authSession,
	ROLE_COOKIE,
	SESSION_COOKIE,
	SESSION_TTL_MS,
} from "@/modules/auth/auth.types";

// Must be false over plain HTTP or the browser silently discards the cookie
const secure = process.env.COOKIE_SECURE
	? process.env.COOKIE_SECURE === "true"
	: process.env.NODE_ENV === "production";

// SameSite=Lax is the CSRF defense here: it suppresses the cookie on
// cross-site POSTs, so no CSRF token is needed at this scope.
// No `domain` is set, so it defaults to the requesting host, which the browser
// sees as the Next.js origin thanks to the /api rewrite.
const baseOptions = {
	httpOnly: true,
	sameSite: "lax" as const,
	secure,
	path: "/",
};

// Minimal Cookie header reader; session tokens are base64url so they never
// need percent-decoding, which keeps this free of a cookie-parser dependency
const readCookie = (req: Request, name: string): string | null => {
	const header = req.headers.cookie;
	if (!header) {
		return null;
	}

	for (const part of header.split(";")) {
		const separator = part.indexOf("=");
		if (separator === -1) {
			continue;
		}

		if (part.slice(0, separator).trim() === name) {
			return part.slice(separator + 1).trim();
		}
	}

	return null;
};

export const readSessionToken = (req: Request): string | null =>
	readCookie(req, SESSION_COOKIE);

export const setSessionCookies = (res: Response, session: authSession): void => {
	res.cookie(SESSION_COOKIE, session.token, {
		...baseOptions,
		maxAge: SESSION_TTL_MS,
	});

	// Non-authoritative role hint so the Next proxy can gate admin pages without
	// a network round trip. Never trusted for data access; requireAdmin reads
	// the database role.
	res.cookie(ROLE_COOKIE, session.user.role, {
		...baseOptions,
		maxAge: SESSION_TTL_MS,
	});
};

// Options must match those used to set the cookies, or the browser will not
// match them and logout silently fails
export const clearSessionCookies = (res: Response): void => {
	res.clearCookie(SESSION_COOKIE, baseOptions);
	res.clearCookie(ROLE_COOKIE, baseOptions);
};
