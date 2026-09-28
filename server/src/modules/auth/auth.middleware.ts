import { NextFunction, Request, Response } from "express";
import {
	clearSessionCookies,
	readSessionToken,
} from "@/modules/auth/auth.cookie";
import { resolveSession } from "@/modules/auth/auth.service";

// CLIENT_ORIGIN is a comma-separated list of the origins the browser loads the
// client from. Normalized through URL so a trailing slash still matches.
const allowedOrigins = (
	process.env.CLIENT_ORIGIN ?? "http://localhost:3000,http://127.0.0.1:3000"
)
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean)
	.map((origin) => new URL(origin).origin);

// The browser reaches the API through the Next /api rewrite, which forwards
// its Origin header. Requests without one (same-origin GETs, server-side
// calls) pass; a foreign origin is refused before any handler runs.
export const requireAllowedOrigin = (
	req: Request,
	res: Response,
	next: NextFunction,
): void | Response => {
	const origin = req.headers.origin;
	if (origin && !allowedOrigins.includes(origin)) {
		return res.status(403).json({ message: "Origin not allowed" });
	}

	return next();
};

// The try/catch is required: this app has no global error middleware, and
// Express's default handler returns HTML rather than the { message } JSON
// shape the client expects.
export const requireAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void | Response> => {
	try {
		const token = readSessionToken(req);
		if (!token) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const user = await resolveSession(token);
		if (!user) {
			// Stale or revoked token: drop the cookies so the client stops retrying
			clearSessionCookies(res);
			return res.status(401).json({ message: "Session expired" });
		}

		req.user = user;
		return next();
	} catch (error) {
		return res.status(500).json({ message: "Failed to verify session" });
	}
};

// Always composed after requireAuth. If req.user were ever unset this still
// fails closed, so there is no mounting order in which it passes unverified.
export const requireAdmin = (
	req: Request,
	res: Response,
	next: NextFunction,
): void | Response => {
	if (req.user?.role !== "admin") {
		return res.status(403).json({ message: "Administrator access required" });
	}

	return next();
};
