export type UserRole = "admin" | "user";

export type UserListItem = {
	id: number;
	username: string;
	email: string;
	role: UserRole;
	created_at: string;
};

export type UserListResponse = {
	users: UserListItem[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};
