export type gameAssets = {
    main_capsule?: string;
    small_capsule?: string;
    header?: string;
    page_background?: string;
    hero_capsule?: string;
    library_capsule?: string;
    library_hero?: string;
    community_icon?: string;
    logo: string;
} | null;

export type gameBasicInfo = {
    app_id: number;
    name: string;
    store_url: string;
    steam_release_date: string;
    price_in_cents: number;
    short_description: string;
    last_updated: string;
    rating_type: string;
    rating: string;
} | null;

export type gamePlatforms = {
    windows: boolean;
    mac: boolean;
    steamos_linux: boolean;
    steam_deck_compat_category: string;
    steam_os_compat_category: string;
} | null;

export type gameReviews = {
    review_count: number;
    percent_positive: number;
    review_score: number;
    review_score_label: string;
} | null;

export type gameTags = [{name: string, weight: number, id: number}];
export type gameDevelopers = string[] | null;
export type gamePublishers = string[] | null;
export type gameLanguages = [{code: string, name: string, supported: boolean, full_audio: boolean, interface: boolean, subtitles: boolean}] | null;
export type gameResponse = {
    game: gameBasicInfo,
    assets: gameAssets,
    platforms: gamePlatforms,
    reviews: gameReviews,
    tags: gameTags,
    developers: gameDevelopers,
    publishers: gamePublishers,
    languages: gameLanguages
} | null;

export type chartAggregationMode =
	| "review_count"
	| "review_score"
	| "release_date"
	| "price"
	| "tag"
	| "supported_languages"
	| "developer"
	| "publisher"
	| "category"
	| "has_demo"
	| "estimated_units"
	| "estimated_revenue";

export const CHART_BUCKET_MIN = 1;
export const CHART_BUCKET_MAX = 1000000;

export type chartAggregationPoint = {
	bucket: string;
	count: number;
	date_bucket: number | null;
	min_value: string | null;
	max_value: string | null;
	aggregate_value: string | null;
	aggregate_review_score: number | null;
	aggregate_percent_positive: number | null;
	aggregate_review_count: number | null;
	aggregate_price_in_cents: number | null;
	// Postgres numeric, so these arrive as strings
	aggregate_estimated_units: string | null;
	aggregate_estimated_units_low: string | null;
	aggregate_estimated_units_high: string | null;
	aggregate_estimated_revenue_in_cents: string | null;
};

export type chartAggregationResponse = {
	mode: chartAggregationMode;
	aggregate: "average" | "median";
	bucket_size: number | null;
	points: chartAggregationPoint[];
};

export type chartFilterMode = "include" | "exclude";

export type chartRangeFilter = {
	min?: number | null;
	max?: number | null;
};

export type chartDateRangeFilter = {
	min?: string | null;
	max?: string | null;
};

export type chartFilters = {
	release_date?: chartDateRangeFilter;
	price?: chartRangeFilter;
	is_demo?: boolean;
	tags?: number[];
	tags_mode?: chartFilterMode;
	languages?: number[];
	languages_mode?: chartFilterMode;
	percent_positive?: chartRangeFilter;
	review_count?: chartRangeFilter;
};

export type chartFilterSql = {
	whereSql: string;
	params: (number | string | boolean | number[])[];
};

export type tagOption = {
	id: number;
	name: string;
};

export type languageOption = {
	id: number;
	code: string;
	name: string;
};
