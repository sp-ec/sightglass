import pool from "@/sql/db";
import { userRole } from "@/modules/auth/auth.types";
import {
	roleUpdateResult,
	userDeleteResult,
	userListItem,
} from "@/modules/users/users.types";

// created_at alone is not a stable sort key: two accounts created in the same
// transaction share a timestamp and could swap between pages. id breaks the tie.
export const findUsersList = async (
	limit: number,
	offset: number,
): Promise<userListItem[]> => {
	try {
		const result = await pool.query(
			`SELECT id, username, email, role, created_at
			FROM users
			ORDER BY created_at DESC, id DESC
			LIMIT $1 OFFSET $2;`,
			[limit, offset],
		);

		return result.rows as userListItem[];
	} catch (error) {
		return [];
	}
};

// node-pg returns bigint as a string, so the count must be cast
export const countUsersList = async (): Promise<number> => {
	try {
		const result = await pool.query(`SELECT COUNT(*)::int AS count FROM users;`);
		return (result.rows[0]?.count as number) ?? 0;
	} catch (error) {
		return 0;
	}
};

// The lock is load-bearing rather than defensive: under READ COMMITTED two
// admins demoting each other concurrently would both read two admins and both
// commit, leaving the platform with zero admins and no way back in, since
// /auth/setup refuses once any user exists. EXCLUSIVE serializes these writes
// while leaving plain SELECTs (login, session lookups) unblocked.
export const updateUserRole = async (
	id: number,
	role: userRole,
): Promise<roleUpdateResult> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		await client.query("LOCK TABLE users IN EXCLUSIVE MODE");

		const existing = await client.query(
			`SELECT id, role FROM users WHERE id = $1 LIMIT 1;`,
			[id],
		);

		const current = existing.rows[0] as
			| { id: number; role: userRole }
			| undefined;

		if (!current) {
			await client.query("ROLLBACK");
			return { result: "missing" };
		}

		const isDemotion = current.role === "admin" && role === "user";

		if (isDemotion) {
			const admins = await client.query(
				`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin';`,
			);

			if (((admins.rows[0]?.count as number) ?? 0) <= 1) {
				await client.query("ROLLBACK");
				return { result: "last_admin" };
			}
		}

		const updated = await client.query(
			`UPDATE users SET role = $2 WHERE id = $1
			RETURNING id, username, email, role, created_at;`,
			[id, role],
		);

		// sa_role is only written at login, so a demoted user's browser would keep
		// rendering admin pages for the cookie's remaining lifetime while every API
		// call 403s. Dropping their sessions forces a re-login that rewrites it.
		// Promotion is deliberately not session-revoking: a stale sa_role=user only
		// under-grants, which is safe, and it self-heals at their next login.
		if (isDemotion) {
			await client.query(`DELETE FROM sessions WHERE user_id = $1;`, [id]);
		}

		await client.query("COMMIT");
		return { result: "updated", user: updated.rows[0] as userListItem };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

// Same locked transaction as updateUserRole, and for the same reason: the
// last-admin check must be atomic with the write
export const deleteUserById = async (id: number): Promise<userDeleteResult> => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");
		await client.query("LOCK TABLE users IN EXCLUSIVE MODE");

		const existing = await client.query(
			`SELECT id, role FROM users WHERE id = $1 LIMIT 1;`,
			[id],
		);

		const current = existing.rows[0] as
			| { id: number; role: userRole }
			| undefined;

		if (!current) {
			await client.query("ROLLBACK");
			return { result: "missing" };
		}

		if (current.role === "admin") {
			const admins = await client.query(
				`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin';`,
			);

			if (((admins.rows[0]?.count as number) ?? 0) <= 1) {
				await client.query("ROLLBACK");
				return { result: "last_admin" };
			}
		}

		// No explicit session delete: sessions.user_id is ON DELETE CASCADE, so
		// the account's sessions go with it
		await client.query(`DELETE FROM users WHERE id = $1;`, [id]);

		await client.query("COMMIT");
		return { result: "deleted" };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};
