export type tagResolution = "average" | "minimum" | "maximum";

export type appSettingsSection = "access" | "api" | "estimation";

// The shape the repository reads back from the singleton row
export type appSettingsRow = {
	registration_enabled: boolean;
	steam_api_key: string | null;
	review_multiplier_baseline: number;
	review_multiplier_min: number;
	review_multiplier_max: number;
	audience_divisor: number;
	audience_exponent: number;
	tag_resolution: tagResolution;
	realized_price_min_multiplier: number;
	realized_price_starting_multiplier: number;
	realized_price_per_year_multiplier: number;
	realized_price_refund_rate_min: number;
	realized_price_refund_rate_multiplier: number;
};

export type tagMultiplier = { tagId: number; tagName: string; mult: number };

export type priceMultiplier = {
	id: number;
	priceInCents: number;
	multiplier: number;
	above: boolean;
};

export type uncertaintyBand = {
	id: number;
	reviewCount: number;
	low: number;
	high: number;
	above: boolean;
};

export type accessSettings = { registrationEnabled: boolean };

// Write-only over the wire: a read never returns the plaintext key
export type apiSettingsView = { hasKey: boolean; maskedKey: string };

export type reviewMultiplierSettings = {
	baseline: number;
	min: number;
	max: number;
};

export type audienceSettings = { divisor: number; exponent: number };

export type realizedPriceSettings = {
	minMultiplier: number;
	startingMultiplier: number;
	perYearMultiplier: number;
	refundRateMin: number;
	refundRateMultiplier: number;
};

export type estimationSettings = {
	reviewMultiplier: reviewMultiplierSettings;
	audience: audienceSettings;
	tagResolution: tagResolution;
	realizedPrice: realizedPriceSettings;
	tagMultipliers: tagMultiplier[];
	priceMultipliers: priceMultiplier[];
	uncertaintyBands: uncertaintyBand[];
};

export type appSettingsView = {
	access: accessSettings;
	api: apiSettingsView;
	estimation: estimationSettings;
};

// Internal cached snapshot. Holds the plaintext key and must NEVER be returned
// from the controller layer.
export type appSettingsSnapshot = Omit<appSettingsView, "api"> & {
	steamApiKey: string | null;
};

export type apiSettingsInput = {
	steamApiKey?: string | null;
	clearSteamApiKey?: boolean;
};

// Row ids are absent: list writes are replace-all, so client-supplied ids are
// never trusted and only exist in responses as React keys
export type estimationSettingsInput = {
	reviewMultiplier: reviewMultiplierSettings;
	audience: audienceSettings;
	tagResolution: tagResolution;
	realizedPrice: realizedPriceSettings;
	tagMultipliers: { tagId: number; mult: number }[];
	priceMultipliers: { priceInCents: number; multiplier: number; above: boolean }[];
	uncertaintyBands: {
		reviewCount: number;
		low: number;
		high: number;
		above: boolean;
	}[];
};

export type appSettingsUpdate =
	| { section: "access"; value: accessSettings }
	| { section: "api"; value: apiSettingsInput }
	| { section: "estimation"; value: estimationSettingsInput };

// Discriminated results let the controller pick a status code without
// using exceptions for control flow
export type appSettingsOutcome =
	| { status: "ok"; appSettings: appSettingsView }
	| { status: "invalid"; message: string };

export type gameEstimateInput = {
	reviewCount: number;
	percentPositive: number;
	priceInCents: number;
	releaseDate: Date | string | null;
	tagIds: number[];
};

export type gameEstimate = {
	units: number;
	unitsLow: number;
	unitsHigh: number;
	revenueInCents: number;
};

// The formula as SQL, for aggregating estimates across the library.
// cteSql defines a game_estimates CTE holding one row per game, so the formula
// is evaluated exactly once per game no matter how many times a query's joins
// duplicate that game's row. The column fragments just reference it.
export type estimationSql = {
	cteSql: string;
	joinSql: string;
	unitsSql: string;
	unitsLowSql: string;
	unitsHighSql: string;
	revenueSql: string;
};

export type tagMultiplierDefault = { name: string; mult: number };

export const TAG_MULTIPLIER_SEED_KEY = "tag_multipliers";

export const DEFAULT_TAG_MULTIPLIERS: tagMultiplierDefault[] = [
	{ name: "Visual Novel", mult: 0.7 },
	{ name: "Narrative", mult: 0.7 },
	{ name: "Multiplayer", mult: 1.2 },
	{ name: "Co-op", mult: 1.2 },
	{ name: "Survival", mult: 1.2 },
];

export const APP_SETTINGS_CACHE_TTL_MS = 30_000;
