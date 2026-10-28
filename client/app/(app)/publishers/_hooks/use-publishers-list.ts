"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { SortOrder } from "@/app/(app)/browse/games-list-types";
import {
	DEFAULT_PUBLISHER_FILTERS,
	PUBLISHER_LIST_SORTS,
	countActivePublisherFilters,
	serializePublisherFilters,
	type PublisherFilters,
	type PublisherListResponse,
	type PublisherListSort,
} from "../publishers-list-types";

const SEARCH_DEBOUNCE_MS = 300;

type publishersListState = {
	data: PublisherListResponse | null;
	loading: boolean;
	error: string | null;
	search: string;
	filters: PublisherFilters;
	activeFilterCount: number;
	sort: PublisherListSort;
	order: SortOrder;
	setSearch: (value: string) => void;
	setPage: (page: number) => void;
	setFilter: <Key extends keyof PublisherFilters>(
		key: Key,
		value: PublisherFilters[Key],
	) => void;
	resetFilters: () => void;
	setSort: (sort: PublisherListSort) => void;
	setOrder: (order: SortOrder) => void;
};

export const usePublishersList = (): publishersListState => {
	const [search, setSearchValue] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [filters, setFilters] = React.useState<PublisherFilters>(
		DEFAULT_PUBLISHER_FILTERS,
	);
	const [debouncedFilters, setDebouncedFilters] = React.useState<
		string | null
	>(null);
	const [sort, setSortValue] =
		React.useState<PublisherListSort>("total_revenue");
	const [order, setOrderValue] = React.useState<SortOrder>("desc");
	const [data, setData] = React.useState<PublisherListResponse | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const serializedFilters = React.useMemo(
		() => serializePublisherFilters(filters),
		[filters],
	);
	const activeFilterCount = React.useMemo(
		() => countActivePublisherFilters(filters),
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

	// Anything that changes the result set restarts at page one
	const setSearch = React.useCallback((value: string) => {
		setSearchValue(value);
		setPage(1);
	}, []);

	const setFilter = React.useCallback(
		<Key extends keyof PublisherFilters>(
			key: Key,
			value: PublisherFilters[Key],
		) => {
			setFilters((current) => ({ ...current, [key]: value }));
			setPage(1);
		},
		[],
	);

	const resetFilters = React.useCallback(() => {
		setFilters(DEFAULT_PUBLISHER_FILTERS);
		setPage(1);
	}, []);

	const setSort = React.useCallback((next: PublisherListSort) => {
		setSortValue(next);
		setOrderValue(
			PUBLISHER_LIST_SORTS.find((option) => option.value === next)
				?.defaultOrder ?? "desc",
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

				const response = await apiFetch(
					`/publishers/list?${params.toString()}`,
					{ signal: controller.signal },
				);

				if (!response.ok) {
					throw new Error("Failed to load publishers");
				}

				setData((await response.json()) as PublisherListResponse);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || "Failed to load publishers");
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
