import { userRole, validationResult } from "@/modules/auth/auth.types";
import {
	countUsersList,
	deleteUserById,
	findUsersList,
	updateUserRole,
} from "@/modules/users/users.repository";
import {
	roleUpdateOutcome,
	userDeleteOutcome,
	userListResponse,
	USERS_PAGE_SIZE,
} from "@/modules/users/users.types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

// A path param is always a string, so "12abc" and "" must not become 12 and 0
const parseUserId = (raw: string | undefined): validationResult<number> => {
	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed <= 0) {
		return { ok: false, message: "Invalid user id" };
	}

	return { ok: true, value: parsed };
};

// The CHECK constraint on users.role would reject anything else anyway, but a
// 400 with a message beats a 500 from a constraint violation
const parseRole = (body: unknown): validationResult<userRole> => {
	if (!isRecord(body)) {
		return { ok: false, message: "Request body is required" };
	}

	if (body.role !== "admin" && body.role !== "user") {
		return { ok: false, message: 'Role must be "admin" or "user"' };
	}

	return { ok: true, value: body.role };
};

// Page comes straight off the query string, so it is clamped here
export const fetchUsersList = async (
	rawPage: string | undefined,
): Promise<userListResponse> => {
	const parsedPage = Number(rawPage);
	const page =
		Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

	const [users, total] = await Promise.all([
		findUsersList(USERS_PAGE_SIZE, (page - 1) * USERS_PAGE_SIZE),
		countUsersList(),
	]);

	return {
		users,
		total,
		page,
		page_size: USERS_PAGE_SIZE,
		total_pages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
	};
};

export const changeUserRole = async (
	actorId: number,
	rawId: string | undefined,
	body: unknown,
): Promise<roleUpdateOutcome> => {
	const id = parseUserId(rawId);
	if (!id.ok) {
		return { status: "invalid", message: id.message };
	}

	const role = parseRole(body);
	if (!role.ok) {
		return { status: "invalid", message: role.message };
	}

	// Self-demotion is the fastest way to lock everyone out of the admin area,
	// and it would leave the acting session holding a stale sa_role=admin cookie.
	// Blocking it is also why the client never needs to refresh its own session
	// after a save here.
	if (id.value === actorId) {
		return { status: "forbidden", message: "You cannot change your own role" };
	}

	const result = await updateUserRole(id.value, role.value);

	switch (result.result) {
		case "updated":
			return { status: "ok", user: result.user };
		case "missing":
			return { status: "not_found" };
		// Unreachable sequentially: requireAdmin guarantees the actor is an admin,
		// so a sole admin target can only be the actor, which the check above
		// already rejected. It is reachable only when two admins demote each other
		// at once, which is why the guard lives inside the repository's lock.
		case "last_admin":
			return {
				status: "conflict",
				message: "The last administrator cannot be demoted",
			};
	}
};

export const removeUser = async (
	actorId: number,
	rawId: string | undefined,
): Promise<userDeleteOutcome> => {
	const id = parseUserId(rawId);
	if (!id.ok) {
		return { status: "invalid", message: id.message };
	}

	if (id.value === actorId) {
		return {
			status: "forbidden",
			message: "You cannot delete your own account",
		};
	}

	const result = await deleteUserById(id.value);

	switch (result.result) {
		case "deleted":
			return { status: "deleted" };
		case "missing":
			return { status: "not_found" };
		case "last_admin":
			return {
				status: "conflict",
				message: "The last administrator cannot be deleted",
			};
	}
};
