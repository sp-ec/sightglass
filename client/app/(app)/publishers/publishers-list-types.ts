import type { RangeInput } from "@/components/charts/chart-types";
import type { SortOrder } from "@/app/(app)/browse/games-list-types";

export type PublisherListEntry = {
	id: number;
	name: string;
	games_published: number;
	total_revenue_in_cents: number;
	median_revenue_in_cents: number;
	average_revenue_in_cents: number;
};

export type PublisherListResponse = {
	publishers: PublisherListEntry[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};

// defaultOrder is applied when the sort is picked
export const PUBLISHER_LIST_SORTS = [
	{ label: "Total Revenue", value: "total_revenue", defaultOrder: "desc" },
	{ label: "Median Revenue", value: "median_revenue", defaultOrder: "desc" },
	{ label: "Average Revenue", value: "average_revenue", defaultOrder: "desc" },
	{ label: "Games Published", value: "games_published", defaultOrder: "desc" },
	{ label: "Name", value: "name", defaultOrder: "asc" },
] as const satisfies readonly {
	label: string;
	value: string;
	defaultOrder: SortOrder;
}[];

export type PublisherListSort = (typeof PUBLISHER_LIST_SORTS)[number]["value"];

// Revenue is entered in dollars and bounds total revenue
export type PublisherFilters = {
	revenue: RangeInput;
	games: RangeInput;
};

export const DEFAULT_PUBLISHER_FILTERS: PublisherFilters = {
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

// Converts panel state into the payload accepted by the /publishers/list filters param
export function serializePublisherFilters(
	filters: PublisherFilters,
): string | null {
	const payload = {
		revenue: parseRange(filters.revenue, (value) => Math.round(value * 100)),
		games: parseRange(filters.games),
	};

	return payload.revenue || payload.games ? JSON.stringify(payload) : null;
}

export function countActivePublisherFilters(filters: PublisherFilters): number {
	return [
		Boolean(filters.revenue.min || filters.revenue.max),
		Boolean(filters.games.min || filters.games.max),
	].filter(Boolean).length;
}
