import { chartRangeFilter } from "@/modules/games/games.types";

// Publishers and developers share every query; only these names differ. They
// are fixed literals, so no client input ever reaches the SQL they build.
export type companyConfig = {
	companyTable: "publishers" | "developers";
	linkTable: "game_publishers" | "game_developers";
	idColumn: "publisher_id" | "developer_id";
	estimatesTable: "publisher_estimates" | "developer_estimates";
	label: "publisher" | "developer";
};

export const PUBLISHER_CONFIG: companyConfig = {
	companyTable: "publishers",
	linkTable: "game_publishers",
	idColumn: "publisher_id",
	estimatesTable: "publisher_estimates",
	label: "publisher",
};

export const DEVELOPER_CONFIG: companyConfig = {
	companyTable: "developers",
	linkTable: "game_developers",
	idColumn: "developer_id",
	estimatesTable: "developer_estimates",
	label: "developer",
};

export type companyListEntry = {
	id: number;
	name: string;
	games_published: number;
	total_revenue_in_cents: number;
	median_revenue_in_cents: number;
	average_revenue_in_cents: number;
};

export type companyListResponse = {
	companies: companyListEntry[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};

// revenue bounds total_revenue_in_cents
export type companyListFilters = {
	revenue?: chartRangeFilter;
	games?: chartRangeFilter;
};

export const COMPANIES_PAGE_SIZE = 25;

export const COMPANIES_LIST_SORTS = [
	"total_revenue",
	"median_revenue",
	"average_revenue",
	"games_published",
	"name",
] as const;

export type companyListSort = (typeof COMPANIES_LIST_SORTS)[number];

// Stats are null when the company has no estimates row
export type companySummary = {
	id: number;
	name: string;
	games_published: number | null;
	total_revenue_in_cents: number | null;
	median_revenue_in_cents: number | null;
	average_revenue_in_cents: number | null;
};

// game_count is how many of the company's games carry the tag
export type companyTagCount = {
	id: number;
	name: string;
	game_count: number;
};

export type namedEntity = { id: number; name: string };

// A row of the company's games, straight from the repository
export type companyGameRow = {
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
export type companyGameEntry = Omit<companyGameRow, "asset_url_format">;

export type companyDetailResponse = {
	company: companySummary;
	tags: companyTagCount[];
	games: companyGameEntry[];
};
