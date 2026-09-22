import {
	findGameByTitle,
	findGameById,
	getGameChartAggregation,
	findAllTags,
	findAllLanguages,
	findGamesList,
	countGamesList,
	findRelatedApps,
} from "./games.repository";
import {
	gameAssets,
	gameBasicInfo,
	gameResponse,
	gameListEntry,
	gameListResponse,
	GAMES_PAGE_SIZE,
	chartAggregationMode,
	chartFilters,
	chartFilterMode,
	chartRangeFilter,
	chartDateRangeFilter,
	CHART_BUCKET_MIN,
	CHART_BUCKET_MAX,
} from "./games.types";
import { getEstimationSettings } from "@/modules/appSettings/appSettings.service";
import {
	buildEstimationSql,
	estimateGame,
} from "@/modules/appSettings/estimation";

// Steam does not ship every asset for every game, and a missing filename would
// otherwise be stringified into the URL as "null" and 404
function formatAssetUrl(
	url: string | null,
	filename: string | null,
): string | null {
	if (!url || !filename) {
		return null;
	}

	let formattedUrl =
		"https://shared.akamai.steamstatic.com/store_item_assets/" + url;
	return formattedUrl.replace("${FILENAME}", filename);
}

function formatCommunityIconUrl(app_id: string, filename: string): string {
	let formattedUrl =
		"https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/" +
		app_id +
		"/" +
		filename +
		".jpg";
	return formattedUrl;
}

function formatBackgroundUrl(app_id: string): string {
	let formattedUrl =
		"https://cdn.cloudflare.steamstatic.com/steam/apps/" +
		app_id +
		"/page_bg_generated_v6b.jpg";
	return formattedUrl;
}

function formatLogoUrl(app_id: string): string {
	let formattedUrl =
		"https://cdn.cloudflare.steamstatic.com/steam/apps/" + app_id + "/logo.png";
	return formattedUrl;
}

export const searchGamesByTitle = async (query: string) => {
	if (!query || typeof query !== "string") {
		return [];
	}

	return await findGameByTitle(query);
};

// Page and search come straight off the query string, so both are clamped here
export const fetchGamesList = async (
	rawPage: string | undefined,
	rawSearch: string | undefined,
): Promise<gameListResponse> => {
	const parsedPage = Number(rawPage);
	const page =
		Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;

	const search = rawSearch?.trim() ? rawSearch.trim() : null;

	const [rows, total] = await Promise.all([
		findGamesList(search, GAMES_PAGE_SIZE, (page - 1) * GAMES_PAGE_SIZE),
		countGamesList(search),
	]);

	const games: gameListEntry[] = rows.map((row) => ({
		app_id: row.app_id,
		name: row.name,
		short_description: row.short_description,
		type: row.type,
		parent_app_id: row.parent_app_id,
		main_capsule:
			row.asset_url_format && row.main_capsule
				? formatAssetUrl(row.asset_url_format, row.main_capsule)
				: null,
		small_capsule:
			row.asset_url_format && row.small_capsule
				? formatAssetUrl(row.asset_url_format, row.small_capsule)
				: null,
		review_count: row.review_count,
		percent_positive: row.percent_positive,
		review_score: row.review_score,
		review_score_label: row.review_score_label,
		tags: row.tags ?? [],
		is_demo: row.type === 1,
	}));

	return {
		games,
		total,
		page,
		page_size: GAMES_PAGE_SIZE,
		total_pages: Math.max(1, Math.ceil(total / GAMES_PAGE_SIZE)),
	};
};

export const fetchGameById = async (appId: string) => {
	if (!appId || typeof appId !== "string") {
		return null;
	}

	const gameData = await findGameById(appId);
	if (!gameData || !gameData.game) {
		return null;
	}

	const urlFormat = gameData.game.asset_url_format;
	let gameResponse: gameResponse = {
		game: {
			app_id: gameData.game.app_id,
			name: gameData.game.name,
			store_url: gameData.game.store_url_path,
			steam_release_date: gameData.game.steam_release_date,
			price_in_cents: gameData.game.price_in_cents,
			short_description: gameData.game.short_description,
			last_updated: gameData.game.last_updated,
			rating_type: gameData.game.rating_type,
			rating: gameData.game.rating,
		},
		assets: {
			main_capsule: formatAssetUrl(urlFormat, gameData.game.main_capsule),
			small_capsule: formatAssetUrl(urlFormat, gameData.game.small_capsule),
			header: formatAssetUrl(urlFormat, gameData.game.header),
			page_background: formatBackgroundUrl(gameData.game.app_id),
			hero_capsule: formatAssetUrl(urlFormat, gameData.game.hero_capsule),
			library_capsule: formatAssetUrl(urlFormat, gameData.game.library_capsule),
			library_hero: formatAssetUrl(urlFormat, gameData.game.library_hero),
			community_icon: formatCommunityIconUrl(
				gameData.game.app_id,
				gameData.game.community_icon,
			),
			logo: formatLogoUrl(gameData.game.app_id),
		},
		platforms: {
			windows: gameData?.game.windows,
			mac: gameData?.game.mac,
			steamos_linux: gameData?.game.steamos_linux,
			steam_deck_compat_category: gameData?.game.steam_deck_compat_category,
			steam_os_compat_category: gameData?.game.steam_os_compat_category,
		},
		reviews: {
			review_count: gameData?.game.review_count,
			percent_positive: gameData?.game.percent_positive,
			review_score: gameData?.game.review_score,
			review_score_label: gameData?.game.review_score_label,
		},
		tags: gameData?.tags,
		developers: gameData?.developers,
		publishers: gameData?.publishers,
		languages: gameData?.languages,
	};

	const [estimationSettings, related] = await Promise.all([
		getEstimationSettings(),
		findRelatedApps(gameData.game.app_id, gameData.game.parent_app_id),
	]);

	const estimate = estimateGame(estimationSettings, {
		reviewCount: gameData.game.review_count ?? 0,
		percentPositive: gameData.game.percent_positive ?? 0,
		priceInCents: gameData.game.price_in_cents ?? 0,
		releaseDate: gameData.game.steam_release_date ?? null,
		tagIds: (gameData.tags ?? []).map((tag) => tag.id),
	});

	return {
		...gameResponse,
		is_demo: gameData.game.type === 1,
		// A demo links to its parent; a full game links to its demo
		parent_app: related.parent,
		demo_app: related.demo,
		estimate: {
			units: estimate.units,
			units_low: estimate.unitsLow,
			units_high: estimate.unitsHigh,
			revenue_in_cents: estimate.revenueInCents,
		},
	};
};

const parseNumericRange = (value: unknown): chartRangeFilter | undefined => {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const { min, max } = value as Record<string, unknown>;
	const parsedMin = Number(min);
	const parsedMax = Number(max);
	const range: chartRangeFilter = {
		min: min != null && Number.isFinite(parsedMin) ? parsedMin : null,
		max: max != null && Number.isFinite(parsedMax) ? parsedMax : null,
	};

	return range.min == null && range.max == null ? undefined : range;
};

const parseDateRange = (value: unknown): chartDateRangeFilter | undefined => {
	if (!value || typeof value !== "object") {
		return undefined;
	}

	const { min, max } = value as Record<string, unknown>;
	const isValidDate = (date: unknown) =>
		typeof date === "string" && !Number.isNaN(Date.parse(date));
	const range: chartDateRangeFilter = {
		min: isValidDate(min) ? (min as string) : null,
		max: isValidDate(max) ? (max as string) : null,
	};

	return range.min == null && range.max == null ? undefined : range;
};

const parseIdList = (value: unknown): number[] | undefined => {
	if (!Array.isArray(value)) {
		return undefined;
	}

	const ids = value
		.map((id) => Number(id))
		.filter((id) => Number.isFinite(id) && Number.isInteger(id));

	return ids.length ? ids : undefined;
};

const parseFilterMode = (value: unknown): chartFilterMode =>
	value === "exclude" ? "exclude" : "include";

export const parseChartFilters = (
	rawFilters: string | undefined,
): chartFilters | undefined => {
	if (!rawFilters) {
		return undefined;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(rawFilters);
	} catch (error) {
		return undefined;
	}

	if (!parsed || typeof parsed !== "object") {
		return undefined;
	}

	const raw = parsed as Record<string, unknown>;
	const filters: chartFilters = {
		release_date: parseDateRange(raw.release_date),
		price: parseNumericRange(raw.price),
		is_demo: typeof raw.is_demo === "boolean" ? raw.is_demo : undefined,
		tags: parseIdList(raw.tags),
		languages: parseIdList(raw.languages),
		percent_positive: parseNumericRange(raw.percent_positive),
		review_count: parseNumericRange(raw.review_count),
	};

	if (filters.tags) {
		filters.tags_mode = parseFilterMode(raw.tags_mode);
	}
	if (filters.languages) {
		filters.languages_mode = parseFilterMode(raw.languages_mode);
	}

	const hasActiveFilter = Object.values(filters).some(
		(value) => value !== undefined,
	);

	return hasActiveFilter ? filters : undefined;
};

export const fetchTagOptions = async () => {
	return await findAllTags();
};

export const fetchLanguageOptions = async () => {
	return await findAllLanguages();
};

export const getChartAggregation = async (
	mode: string,
	bucketSize: string | undefined,
	aggregate: "average" | "median" = "average",
	tagsCounted?: number | null,
	rawFilters?: string,
) => {
	const allowedModes: chartAggregationMode[] = [
		"review_count",
		"review_score",
		"release_date",
		"price",
		"tag",
		"supported_languages",
		"developer",
		"publisher",
		"category",
		"has_demo",
		"estimated_units",
		"estimated_revenue",
	];

	if (!allowedModes.includes(mode as chartAggregationMode)) {
		return null;
	}

	const parsedBucketSize = bucketSize ? Number(bucketSize) : CHART_BUCKET_MIN;
	const normalizedBucketSize = Number.isFinite(parsedBucketSize)
		? Math.min(CHART_BUCKET_MAX, Math.max(CHART_BUCKET_MIN, parsedBucketSize))
		: null;

	// Estimates are computed inside the chart query from the current settings,
	// so an admin's change is reflected on the next request
	const estimationSettings = await getEstimationSettings();

	let chartData = await getGameChartAggregation(
		mode as chartAggregationMode,
		normalizedBucketSize,
		aggregate,
		tagsCounted,
		parseChartFilters(rawFilters),
		buildEstimationSql(estimationSettings),
	);

	if (mode === "release_date") {
		let chartPoints = chartData.points
			.map((point) => {
				if (point.bucket !== null) {
					point.date_bucket = parseInt(point.bucket);

					//check for unreleased games
					if (point.date_bucket < 0) {
						point.bucket = "Unreleased";
						point.min_value = null;
						point.max_value = null;
						point.aggregate_value = null;
						return point;
					}

					point.bucket = new Date(parseInt(point.bucket) * 1000).toDateString();
					point.min_value = new Date(
						parseInt(point.min_value ?? "0") * 1000,
					).toDateString();
					point.max_value = new Date(
						parseInt(point.max_value ?? "0") * 1000,
					).toDateString();
					point.aggregate_value = new Date(
						parseInt(point.aggregate_value ?? "0") * 1000,
					).toDateString();
				}
				return point;
			})
			.filter((point) => point.date_bucket !== null && point.date_bucket > 0);
		return { ...chartData, points: chartPoints };
	}

	return chartData;
};
