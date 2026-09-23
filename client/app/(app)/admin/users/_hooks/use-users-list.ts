"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { UserListResponse } from "../users-types";

type usersListState = {
	data: UserListResponse | null;
	loading: boolean;
	error: string | null;
	page: number;
	setPage: (page: number) => void;
	reload: () => void;
};

export const useUsersList = (): usersListState => {
	const [page, setPage] = React.useState(1);
	const [reloadToken, setReloadToken] = React.useState(0);
	const [data, setData] = React.useState<UserListResponse | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	// Rows call this after a save or delete so the list refetches rather than
	// patching a row in place; the server response stays the only source of truth
	const reload = React.useCallback(() => {
		setReloadToken((token) => token + 1);
	}, []);

	React.useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const response = await apiFetch(`/users/list?page=${page}`, {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error("Failed to load users");
				}

				setData((await response.json()) as UserListResponse);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load users");
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		void load();

		return () => {
			controller.abort();
		};
	}, [page, reloadToken]);

	return { data, loading, error, page, setPage, reload };
};
