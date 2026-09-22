"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { GameListResponse } from "../games-list-types";

const SEARCH_DEBOUNCE_MS = 300;

type gamesListState = {
	data: GameListResponse | null;
	loading: boolean;
	error: string | null;
	search: string;
	page: number;
	setSearch: (value: string) => void;
	setPage: (page: number) => void;
};

export const useGamesList = (): gamesListState => {
	const [search, setSearchValue] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [data, setData] = React.useState<GameListResponse | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		const timer = window.setTimeout(
			() => setDebouncedSearch(search),
			SEARCH_DEBOUNCE_MS,
		);
		return () => window.clearTimeout(timer);
	}, [search]);

	// A new search restarts at page one; without this an empty page 900 shows
	const setSearch = React.useCallback((value: string) => {
		setSearchValue(value);
		setPage(1);
	}, []);

	React.useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({ page: String(page) });
				if (debouncedSearch.trim()) {
					params.set("search", debouncedSearch.trim());
				}

				const response = await apiFetch(`/games/list?${params.toString()}`, {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error("Failed to load games");
				}

				setData((await response.json()) as GameListResponse);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load games");
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
	}, [page, debouncedSearch]);

	return { data, loading, error, search, page, setSearch, setPage };
};
