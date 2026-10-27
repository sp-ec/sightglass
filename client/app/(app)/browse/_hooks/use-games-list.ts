"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import {
	ChartFilters,
	DEFAULT_CHART_FILTERS,
	countActiveChartFilters,
	serializeChartFilters,
} from "@/components/charts/chart-types";
import {
	GAME_LIST_SORTS,
	type GameListResponse,
	type GameListSort,
	type SortOrder,
} from "../games-list-types";

const SEARCH_DEBOUNCE_MS = 300;

type gamesListState = {
	data: GameListResponse | null;
	loading: boolean;
	error: string | null;
	search: string;
	page: number;
	filters: ChartFilters;
	activeFilterCount: number;
	sort: GameListSort;
	order: SortOrder;
	setSearch: (value: string) => void;
	setPage: (page: number) => void;
	setFilter: <Key extends keyof ChartFilters>(
		key: Key,
		value: ChartFilters[Key],
	) => void;
	resetFilters: () => void;
	setSort: (sort: GameListSort) => void;
	setOrder: (order: SortOrder) => void;
};

export const useGamesList = (): gamesListState => {
	const [search, setSearchValue] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [filters, setFilters] =
		React.useState<ChartFilters>(DEFAULT_CHART_FILTERS);
	const [debouncedFilters, setDebouncedFilters] = React.useState<
		string | null
	>(null);
	const [sort, setSortValue] = React.useState<GameListSort>("review_count");
	const [order, setOrderValue] = React.useState<SortOrder>("desc");
	const [data, setData] = React.useState<GameListResponse | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const serializedFilters = React.useMemo(
		() => serializeChartFilters(filters),
		[filters],
	);
	const activeFilterCount = React.useMemo(
		() => countActiveChartFilters(filters),
		[filters],
	);

	React.useEffect(() => {
		const timer = window.setTimeout(
			() => setDebouncedSearch(search),
			SEARCH_DEBOUNCE_MS,
		);
		return () => window.clearTimeout(timer);
	}, [search]);

	// Typed ranges would otherwise refetch on every keystroke
	React.useEffect(() => {
		const timer = window.setTimeout(
			() => setDebouncedFilters(serializedFilters),
			SEARCH_DEBOUNCE_MS,
		);
		return () => window.clearTimeout(timer);
	}, [serializedFilters]);

	// Anything that changes the result set restarts at page one; without this
	// an empty page 900 shows
	const setSearch = React.useCallback((value: string) => {
		setSearchValue(value);
		setPage(1);
	}, []);

	const setFilter = React.useCallback(
		<Key extends keyof ChartFilters>(key: Key, value: ChartFilters[Key]) => {
			setFilters((current) => ({ ...current, [key]: value }));
			setPage(1);
		},
		[],
	);

	const resetFilters = React.useCallback(() => {
		setFilters(DEFAULT_CHART_FILTERS);
		setPage(1);
	}, []);

	const setSort = React.useCallback((next: GameListSort) => {
		setSortValue(next);
		setOrderValue(
			GAME_LIST_SORTS.find((option) => option.value === next)?.defaultOrder ??
				"desc",
		);
		setPage(1);
	}, []);

	const setOrder = React.useCallback((next: SortOrder) => {
		setOrderValue(next);
		setPage(1);
	}, []);

	React.useEffect(() => {
		const controller = new AbortController();

		const load = async () => {
			setLoading(true);
			setError(null);

			try {
				const params = new URLSearchParams({
					page: String(page),
					sort,
					order,
				});
				if (debouncedSearch.trim()) {
					params.set("search", debouncedSearch.trim());
				}
				if (debouncedFilters) {
					params.set("filters", debouncedFilters);
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
	}, [page, debouncedSearch, debouncedFilters, sort, order]);

	return {
		data,
		loading,
		error,
		search,
		page,
		filters,
		activeFilterCount,
		sort,
		order,
		setSearch,
		setPage,
		setFilter,
		resetFilters,
		setSort,
		setOrder,
	};
};
