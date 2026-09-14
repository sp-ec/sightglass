import pool from "@/sql/db";
import { authUser, userRecord, userRole } from "@/modules/auth/auth.types";

export const countUsers = async (): Promise<number> => {
	try {
		const result = await pool.query(`SELECT COUNT(*)::int AS count FROM users;`);
		return (result.rows[0]?.count as number) ?? 0;
	} catch (error) {
		return 0;
	}
};

export const findUserByEmail = async (
	email: string,
): Promise<userRecord | null> => {
	try {
		const result = await pool.query(
			`SELECT id, email, username, role, created_at, password_hash FROM users
			WHERE LOWER(email) = LOWER($1)
			LIMIT 1;`,
			[email],
		);

		return (result.rows[0] as userRecord) ?? null;
	} catch (error) {
		return null;
	}
};

export const findUserById = async (id: number): Promise<authUser | null> => {
	try {
		const result = await pool.query(
			`SELECT id, email, username, role, created_at FROM users
			WHERE id = $1
			LIMIT 1;`,
			[id],
		);

		return (result.rows[0] as authUser) ?? null;
	} catch (error) {
		return null;
	}
};

// Errors bubble so the service can detect a unique violation (code 23505)
export const insertUser = async (
	email: string,
	username: string,
	passwordHash: string,
	role: userRole,
): Promise<authUser> => {
	const result = await pool.query(
		`INSERT INTO users (email, username, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, username, role, created_at;`,
		[email, username, passwordHash, role],
	);

	return result.rows[0] as authUser;
};

// Returns null when the application has already been initialized.
// The lock closes the race where two concurrent setup requests both read an
// empty table and both insert an admin.
export const insertInitialAdmin = async (
	email: string,
	username: string,
	passwordHash: string,
): Promise<authUser | null> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		// EXCLUSIVE serializes concurrent setup attempts against each other
		// while leaving plain SELECTs (login, session lookups) unblocked
		await client.query("LOCK TABLE users IN EXCLUSIVE MODE");

		const existing = await client.query(`SELECT 1 FROM users LIMIT 1;`);
		if (existing.rowCount && existing.rowCount > 0) {
			await client.query("ROLLBACK");
			return null;
		}

		const result = await client.query(
			`INSERT INTO users (email, username, password_hash, role)
			VALUES ($1, $2, $3, 'admin')
			RETURNING id, email, username, role, created_at;`,
			[email, username, passwordHash],
		);

		await client.query("COMMIT");
		return result.rows[0] as authUser;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

export const insertSession = async (
	tokenHash: string,
	userId: number,
	expiresAt: Date,
): Promise<void> => {
	await pool.query(
		`INSERT INTO sessions (token_hash, user_id, expires_at)
		VALUES ($1, $2, $3);`,
		[tokenHash, userId, expiresAt],
	);
};

// Expiry is filtered in SQL so an expired row can never authenticate,
// even when the periodic cleanup has not run
export const findSessionUser = async (
	tokenHash: string,
): Promise<authUser | null> => {
	try {
		const result = await pool.query(
			`SELECT users.id, users.email, users.username, users.role, users.created_at
			FROM sessions
			JOIN users ON users.id = sessions.user_id
			WHERE sessions.token_hash = $1 AND sessions.expires_at > NOW()
			LIMIT 1;`,
			[tokenHash],
		);

		return (result.rows[0] as authUser) ?? null;
	} catch (error) {
		return null;
	}
};

export const deleteSession = async (tokenHash: string): Promise<void> => {
	await pool.query(`DELETE FROM sessions WHERE token_hash = $1;`, [tokenHash]);
};

export const deleteExpiredSessions = async (): Promise<number> => {
	try {
		const result = await pool.query(
			`DELETE FROM sessions WHERE expires_at <= NOW();`,
		);
		return result.rowCount ?? 0;
	} catch (error) {
		return 0;
	}
};
