import { createHash, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import {
	countUsers,
	deleteExpiredSessions,
	deleteSession,
	findSessionUser,
	findUserByEmail,
	insertInitialAdmin,
	insertSession,
	insertUser,
} from "@/modules/auth/auth.repository";
import {
	authSession,
	authUser,
	credentials,
	loginOutcome,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	registerOutcome,
	registration,
	SESSION_TTL_MS,
	validationResult,
} from "@/modules/auth/auth.types";
import { isRegistrationOpen } from "@/modules/appSettings/appSettings.service";

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

// 256 bits of entropy, cookie-safe, no padding
const createToken = (): string => randomBytes(32).toString("base64url");

// SHA-256 rather than bcrypt: the token is already high-entropy random, so a
// slow KDF buys nothing and would cost ~100ms on every authenticated request
const hashToken = (token: string): string =>
	createHash("sha256").update(token).digest("hex");

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const validatePassword = (value: unknown): validationResult<string> => {
	if (typeof value !== "string") {
		return { ok: false, message: "Password is required" };
	}

	if (value.length < PASSWORD_MIN_LENGTH) {
		return {
			ok: false,
			message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
		};
	}

	if (value.length > PASSWORD_MAX_LENGTH) {
		return {
			ok: false,
			message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
		};
	}

	return { ok: true, value };
};

const validateEmail = (value: unknown): validationResult<string> => {
	if (typeof value !== "string") {
		return { ok: false, message: "Email is required" };
	}

	const email = value.trim().toLowerCase();
	const separator = email.indexOf("@");
	const hasParts =
		separator > 0 && separator < email.length - 1 && !email.includes(" ");

	if (!hasParts || email.length > 255) {
		return { ok: false, message: "Enter a valid email address" };
	}

	return { ok: true, value: email };
};

const validateUsername = (value: unknown): validationResult<string> => {
	if (typeof value !== "string") {
		return { ok: false, message: "Username is required" };
	}

	const username = value.trim();
	if (username.length < 3 || username.length > 50) {
		return {
			ok: false,
			message: "Username must be between 3 and 50 characters",
		};
	}

	if (!USERNAME_PATTERN.test(username)) {
		return {
			ok: false,
			message: "Username may only contain letters, numbers, hyphens and underscores",
		};
	}

	return { ok: true, value: username };
};

const validateRegistration = (
	body: unknown,
): validationResult<registration> => {
	if (!isRecord(body)) {
		return { ok: false, message: "Request body is required" };
	}

	const email = validateEmail(body.email);
	if (!email.ok) {
		return email;
	}

	const username = validateUsername(body.username);
	if (!username.ok) {
		return username;
	}

	const password = validatePassword(body.password);
	if (!password.ok) {
		return password;
	}

	return {
		ok: true,
		value: {
			email: email.value,
			username: username.value,
			password: password.value,
		},
	};
};

const validateCredentials = (body: unknown): validationResult<credentials> => {
	if (!isRecord(body)) {
		return { ok: false, message: "Request body is required" };
	}

	if (typeof body.email !== "string" || typeof body.password !== "string") {
		return { ok: false, message: "Email and password are required" };
	}

	return {
		ok: true,
		value: { email: body.email.trim().toLowerCase(), password: body.password },
	};
};

const hashPassword = async (password: string): Promise<string> =>
	bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS ?? 12));

const createSession = async (user: authUser): Promise<authSession> => {
	const token = createToken();
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

	await insertSession(hashToken(token), user.id, expiresAt);

	return { user, token, expiresAt };
};

// Postgres raises 23505 when a unique index is violated
const isUniqueViolation = (error: unknown): boolean =>
	isRecord(error) && error.code === "23505";

// registrationEnabled rides along on this anonymous endpoint so the signup page
// can hide its form without opening the whole app settings object to the public
export const getAuthStatus = async (): Promise<{
	initialized: boolean;
	registrationEnabled: boolean;
}> => {
	const total = await countUsers();
	return {
		initialized: total > 0,
		registrationEnabled: await isRegistrationOpen(),
	};
};

export const registerInitialAdmin = async (
	body: unknown,
): Promise<registerOutcome> => {
	const validated = validateRegistration(body);
	if (!validated.ok) {
		return { status: "invalid", message: validated.message };
	}

	const { email, username, password } = validated.value;
	const passwordHash = await hashPassword(password);

	try {
		const user = await insertInitialAdmin(email, username, passwordHash);
		if (!user) {
			return {
				status: "conflict",
				message: "Application is already initialized",
			};
		}

		return { status: "created", session: await createSession(user) };
	} catch (error) {
		if (isUniqueViolation(error)) {
			return {
				status: "conflict",
				message: "An account with that email or username already exists",
			};
		}

		throw error;
	}
};

export const registerUser = async (body: unknown): Promise<registerOutcome> => {
	if (!(await isRegistrationOpen())) {
		return { status: "forbidden", message: "Sign-ups are currently disabled" };
	}

	// Guards against racing the very first signup: without this a normal user
	// could be created before the admin, closing /setup permanently
	const { initialized } = await getAuthStatus();
	if (!initialized) {
		return { status: "conflict", message: "Application is not initialized" };
	}

	const validated = validateRegistration(body);
	if (!validated.ok) {
		return { status: "invalid", message: validated.message };
	}

	const { email, username, password } = validated.value;
	const passwordHash = await hashPassword(password);

	try {
		const user = await insertUser(email, username, passwordHash, "user");
		return { status: "created", session: await createSession(user) };
	} catch (error) {
		if (isUniqueViolation(error)) {
			return {
				status: "conflict",
				message: "An account with that email or username already exists",
			};
		}

		throw error;
	}
};

export const authenticate = async (body: unknown): Promise<loginOutcome> => {
	const validated = validateCredentials(body);
	if (!validated.ok) {
		return { status: "rejected" };
	}

	const record = await findUserByEmail(validated.value.email);
	if (!record) {
		return { status: "rejected" };
	}

	const matches = await bcrypt.compare(
		validated.value.password,
		record.password_hash,
	);
	if (!matches) {
		return { status: "rejected" };
	}

	const user: authUser = {
		id: record.id,
		email: record.email,
		username: record.username,
		role: record.role,
		created_at: record.created_at,
	};

	return { status: "authenticated", session: await createSession(user) };
};

export const resolveSession = async (
	token: string,
): Promise<authUser | null> => findSessionUser(hashToken(token));

export const endSession = async (token: string): Promise<void> =>
	deleteSession(hashToken(token));

export const purgeExpiredSessions = async (): Promise<void> => {
	await deleteExpiredSessions();
};
