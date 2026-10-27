export type GameListEntry = {
	app_id: number;
	name: string;
	short_description: string | null;
	type: number | null;
	parent_app_id: number | null;
	main_capsule: string | null;
	header: string | null;
	review_count: number | null;
	percent_positive: number | null;
	review_score: number | null;
	review_score_label: string | null;
	steam_release_date: string | null;
	price_in_cents: number | null;
	tags: string[];
	is_demo: boolean;
};

export type SortOrder = "asc" | "desc";

// defaultOrder is applied when the sort is picked
export const GAME_LIST_SORTS = [
	{ label: "Review Count", value: "review_count", defaultOrder: "desc" },
	{
		label: "Positive Reviews",
		value: "percent_positive",
		defaultOrder: "desc",
	},
	{ label: "Release Date", value: "release_date", defaultOrder: "desc" },
	{ label: "Price", value: "price", defaultOrder: "asc" },
	{ label: "Name", value: "name", defaultOrder: "asc" },
] as const satisfies readonly {
	label: string;
	value: string;
	defaultOrder: SortOrder;
}[];

export type GameListSort = (typeof GAME_LIST_SORTS)[number]["value"];

export type GameListResponse = {
	games: GameListEntry[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};
