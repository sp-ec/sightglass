export type GameBasicInfo = {
	app_id: number;
	name: string;
	store_url: string | null;
	steam_release_date: string | null;
	price_in_cents: number | null;
	short_description: string | null;
	last_updated: string | null;
	rating_type: string | null;
	rating: string | null;
};

export type GamePlatforms = {
	windows: boolean | null;
	mac: boolean | null;
	steamos_linux: boolean | null;
	steam_deck_compat_category: number | null;
	steam_os_compat_category: number | null;
} | null;

export type GameReviews = {
	review_count: number | null;
	percent_positive: number | null;
	review_score: number | null;
	review_score_label: string | null;
} | null;

export type GameAssets = {
	main_capsule: string | null;
	small_capsule: string | null;
	header: string | null;
	page_background: string | null;
	hero_capsule: string | null;
	library_capsule: string | null;
	library_hero: string | null;
	community_icon: string | null;
	logo: string | null;
} | null;

export type GameTag = { id: number; name: string; weight: number };
export type NamedEntity = { id: number; name: string };

export type GameLanguage = {
	code: string | null;
	name: string;
	supported: boolean | null;
	full_audio: boolean | null;
	subtitles: boolean | null;
};

export type RelatedApp = { app_id: number; name: string } | null;

export type GameEstimate = {
	units: number;
	units_low: number;
	units_high: number;
	revenue_in_cents: number;
} | null;

export type GameDetail = {
	game: GameBasicInfo;
	assets: GameAssets;
	platforms: GamePlatforms;
	reviews: GameReviews;
	tags: GameTag[] | null;
	developers: NamedEntity[] | null;
	publishers: NamedEntity[] | null;
	languages: GameLanguage[] | null;
	is_demo: boolean;
	parent_app: RelatedApp;
	demo_app: RelatedApp;
	estimate: GameEstimate;
};

// Steam's compatibility categories, shared by Steam Deck and SteamOS
export const COMPAT_LABELS: Record<number, string> = {
	0: "Unknown",
	1: "Unsupported",
	2: "Playable",
	3: "Verified",
};
