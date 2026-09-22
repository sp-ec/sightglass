export type GameListEntry = {
	app_id: number;
	name: string;
	short_description: string | null;
	type: number | null;
	parent_app_id: number | null;
	main_capsule: string | null;
	review_count: number | null;
	percent_positive: number | null;
	review_score: number | null;
	review_score_label: string | null;
	tags: string[];
	is_demo: boolean;
};

export type GameListResponse = {
	games: GameListEntry[];
	total: number;
	page: number;
	page_size: number;
	total_pages: number;
};
