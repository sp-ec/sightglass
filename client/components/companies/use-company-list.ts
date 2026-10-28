"use client";

import * as React from "react";
import { apiFetch } from "@/lib/api";
import type { SortOrder } from "@/app/(app)/browse/games-list-types";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";
import {
	DEFAULT_COMPANY_FILTERS,
	companyListSorts,
	countActiveCompanyFilters,
	serializeCompanyFilters,
	type CompanyFilters,
	type CompanyListResponse,
	type CompanyListSort,
} from "./company-list-types";

const SEARCH_DEBOUNCE_MS = 300;

type companyListState = {
	data: CompanyListResponse | null;
	loading: boolean;
	error: string | null;
	search: string;
	filters: CompanyFilters;
	activeFilterCount: number;
	sort: CompanyListSort;
	order: SortOrder;
	setSearch: (value: string) => void;
	setPage: (page: number) => void;
	setFilter: <Key extends keyof CompanyFilters>(
		key: Key,
		value: CompanyFilters[Key],
	) => void;
	resetFilters: () => void;
	setSort: (sort: CompanyListSort) => void;
	setOrder: (order: SortOrder) => void;
};

export const useCompanyList = (kind: CompanyKind): companyListState => {
	const { path, plural } = COMPANY_KINDS[kind];

	const [search, setSearchValue] = React.useState("");
	const [debouncedSearch, setDebouncedSearch] = React.useState("");
	const [page, setPage] = React.useState(1);
	const [filters, setFilters] = React.useState<CompanyFilters>(
		DEFAULT_COMPANY_FILTERS,
	);
	const [debouncedFilters, setDebouncedFilters] = React.useState<
		string | null
	>(null);
	const [sort, setSortValue] = React.useState<CompanyListSort>("total_revenue");
	const [order, setOrderValue] = React.useState<SortOrder>("desc");
	const [data, setData] = React.useState<CompanyListResponse | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState<string | null>(null);

	const serializedFilters = React.useMemo(
		() => serializeCompanyFilters(filters),
		[filters],
	);
	const activeFilterCount = React.useMemo(
		() => countActiveCompanyFilters(filters),
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
		<Key extends keyof CompanyFilters>(key: Key, value: CompanyFilters[Key]) => {
			setFilters((current) => ({ ...current, [key]: value }));
			setPage(1);
		},
		[],
	);

	const resetFilters = React.useCallback(() => {
		setFilters(DEFAULT_COMPANY_FILTERS);
		setPage(1);
	}, []);

	const setSort = React.useCallback(
		(next: CompanyListSort) => {
			setSortValue(next);
			setOrderValue(
				companyListSorts(kind).find((option) => option.value === next)
					?.defaultOrder ?? "desc",
			);
			setPage(1);
		},
		[kind],
	);

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

				const response = await apiFetch(`${path}/list?${params.toString()}`, {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error(`Failed to load ${plural}`);
				}

				setData((await response.json()) as CompanyListResponse);
			} catch (err) {
				if ((err as Error).name !== "AbortError") {
					setError((err as Error).message || `Failed to load ${plural}`);
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
	}, [path, plural, page, debouncedSearch, debouncedFilters, sort, order]);

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
