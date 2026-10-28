import { chartRangeFilter } from "@/modules/games/games.types";

export type publisherListEntry = {
	id: number;
	name: string;
	games_published: number;
	total_revenue_in_cents: number;
	median_revenue_in_cents: number;
	average_revenue_in_cents: number;
};

export type publisherListResponse = {
	publishers: publisherListEntry[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};

// revenue bounds total_revenue_in_cents
export type publisherListFilters = {
	revenue?: chartRangeFilter;
	games?: chartRangeFilter;
};

export const PUBLISHERS_PAGE_SIZE = 25;

export const PUBLISHERS_LIST_SORTS = [
	"total_revenue",
	"median_revenue",
	"average_revenue",
	"games_published",
	"name",
] as const;

export type publisherListSort = (typeof PUBLISHERS_LIST_SORTS)[number];
