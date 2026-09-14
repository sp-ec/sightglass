export type userRole = "admin" | "user";

export type authUser = {
	id: number;
	email: string;
	username: string;
	role: userRole;
	created_at: string;
};

// Only ever leaves the repository; never serialized into a response
export type userRecord = authUser & { password_hash: string };

export type authSession = {
	user: authUser;
	token: string;
	expiresAt: Date;
};

export type registration = {
	email: string;
	username: string;
	password: string;
};

export type credentials = {
	email: string;
	password: string;
};

// Discriminated results let controllers pick a status code without
// using exceptions for control flow
export type registerOutcome =
	| { status: "created"; session: authSession }
	| { status: "invalid"; message: string }
	| { status: "conflict"; message: string }
	| { status: "forbidden"; message: string };

export type loginOutcome =
	| { status: "authenticated"; session: authSession }
	| { status: "rejected" };

export type validationResult<T> =
	| { ok: true; value: T }
	| { ok: false; message: string };

export const SESSION_COOKIE = "sa_session";
export const ROLE_COOKIE = "sa_role";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// bcrypt silently truncates input at 72 bytes, so anything longer would let
// two different passwords collide. Reject rather than truncate.
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
