import type { NamedEntity } from "@/app/(app)/games/[app_id]/game-detail-types";

// Stats are null until the company has an estimate row
export type CompanySummary = {
	id: number;
	name: string;
	games_published: number | null;
	total_revenue_in_cents: number | null;
	median_revenue_in_cents: number | null;
	average_revenue_in_cents: number | null;
};

// game_count is how many of the company's games carry the tag
export type CompanyTagCount = {
	id: number;
	name: string;
	game_count: number;
};

export type CompanyGame = {
	app_id: number;
	name: string;
	steam_release_date: string | null;
	price_in_cents: number | null;
	review_count: number | null;
	percent_positive: number | null;
	review_score: number | null;
	small_capsule: string | null;
	header: string | null;
	estimated_units: number | null;
	estimated_revenue_in_cents: number | null;
	tags: string[];
	developers: NamedEntity[];
	publishers: NamedEntity[];
};

export type CompanyDetail = {
	company: CompanySummary;
	tags: CompanyTagCount[];
	games: CompanyGame[];
};

export const COMPANY_GAMES_PAGE_SIZE = 25;
