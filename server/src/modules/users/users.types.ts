import { userRole } from "@/modules/auth/auth.types";

// Deliberately omits password_hash; this is the shape that leaves the controller
export type userListItem = {
	id: number;
	username: string;
	email: string;
	role: userRole;
	created_at: string;
};

export type userListResponse = {
	users: userListItem[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};

// What the repository transaction concluded. The service maps these onto
// outcomes, so the repository stays free of HTTP vocabulary.
export type roleUpdateResult =
	| { result: "updated"; user: userListItem }
	| { result: "missing" }
	| { result: "last_admin" };

export type userDeleteResult =
	| { result: "deleted" }
	| { result: "missing" }
	| { result: "last_admin" };

// Discriminated results let the controller pick a status code without
// using exceptions for control flow
export type roleUpdateOutcome =
	| { status: "ok"; user: userListItem }
	| { status: "invalid"; message: string }
	| { status: "forbidden"; message: string }
	| { status: "not_found" }
	| { status: "conflict"; message: string };

export type userDeleteOutcome =
	| { status: "deleted" }
	| { status: "invalid"; message: string }
	| { status: "forbidden"; message: string }
	| { status: "not_found" }
	| { status: "conflict"; message: string };

export const USERS_PAGE_SIZE = 20;
