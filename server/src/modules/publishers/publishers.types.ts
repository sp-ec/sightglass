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

// Stats are null when the publisher has no publisher_estimates row
export type publisherSummary = {
	id: number;
	name: string;
	games_published: number | null;
	total_revenue_in_cents: number | null;
	median_revenue_in_cents: number | null;
	average_revenue_in_cents: number | null;
};

// game_count is how many of the publisher's games carry the tag
export type publisherTagCount = {
	id: number;
	name: string;
	game_count: number;
};

export type namedEntity = { id: number; name: string };

// A row of the publisher's games, straight from the repository
export type publisherGameRow = {
	app_id: number;
	name: string;
	steam_release_date: string | null;
	price_in_cents: number | null;
	review_count: number | null;
	percent_positive: number | null;
	review_score: number | null;
	asset_url_format: string | null;
	small_capsule: string | null;
	header: string | null;
	estimated_units: number | null;
	estimated_revenue_in_cents: number | null;
	tags: string[];
	developers: namedEntity[];
	publishers: namedEntity[];
};

// The same row with the capsules resolved to URLs, as the client sees it
export type publisherGameEntry = Omit<publisherGameRow, "asset_url_format">;

export type publisherDetailResponse = {
	publisher: publisherSummary;
	tags: publisherTagCount[];
	games: publisherGameEntry[];
};
