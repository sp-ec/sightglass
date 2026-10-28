import type { RangeInput } from "@/components/charts/chart-types";
import type { SortOrder } from "@/app/(app)/browse/games-list-types";
import { COMPANY_KINDS, type CompanyKind } from "./company-kinds";

export type CompanyListEntry = {
	id: number;
	name: string;
	games_published: number;
	total_revenue_in_cents: number;
	median_revenue_in_cents: number;
	average_revenue_in_cents: number;
};

export type CompanyListResponse = {
	companies: CompanyListEntry[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};

export type CompanyListSort =
	| "total_revenue"
	| "median_revenue"
	| "average_revenue"
	| "games_published"
	| "name";

type CompanyListSortOption = {
	label: string;
	value: CompanyListSort;
	defaultOrder: SortOrder;
};

// defaultOrder is applied when the sort is picked
export const companyListSorts = (kind: CompanyKind): CompanyListSortOption[] => [
	{ label: "Total Revenue", value: "total_revenue", defaultOrder: "desc" },
	{ label: "Median Revenue", value: "median_revenue", defaultOrder: "desc" },
	{ label: "Average Revenue", value: "average_revenue", defaultOrder: "desc" },
	{
		label: COMPANY_KINDS[kind].gamesLabel,
		value: "games_published",
		defaultOrder: "desc",
	},
	{ label: "Name", value: "name", defaultOrder: "asc" },
];

// Revenue is entered in dollars and bounds total revenue
export type CompanyFilters = {
	revenue: RangeInput;
	games: RangeInput;
};

export const DEFAULT_COMPANY_FILTERS: CompanyFilters = {
	revenue: { min: "", max: "" },
	games: { min: "", max: "" },
};

const parseBound = (raw: string, transform: (value: number) => number) => {
	if (raw.trim() === "") return null;
	const parsed = Number(raw);
	return Number.isFinite(parsed) ? transform(parsed) : null;
};

const parseRange = (
	range: RangeInput,
	transform: (value: number) => number = (value) => value,
) => {
	const min = parseBound(range.min, transform);
	const max = parseBound(range.max, transform);
	return min == null && max == null ? undefined : { min, max };
};

// Converts panel state into the payload accepted by the /list filters param
export function serializeCompanyFilters(filters: CompanyFilters): string | null {
	const payload = {
		revenue: parseRange(filters.revenue, (value) => Math.round(value * 100)),
		games: parseRange(filters.games),
	};

	return payload.revenue || payload.games ? JSON.stringify(payload) : null;
}

export function countActiveCompanyFilters(filters: CompanyFilters): number {
	return [
		Boolean(filters.revenue.min || filters.revenue.max),
		Boolean(filters.games.min || filters.games.max),
	].filter(Boolean).length;
}
