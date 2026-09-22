import pool from "@/sql/db";
import {
	gameAssets,
	gameResponse,
	gameLanguages,
	gameDevelopers,
	gamePublishers,
	gameTags,
	chartAggregationMode,
	chartAggregationPoint,
	chartAggregationResponse,
	chartFilters,
	chartFilterSql,
	tagOption,
	languageOption,
	CHART_BUCKET_MIN,
	CHART_BUCKET_MAX,
} from "./games.types";
import { estimationSql } from "@/modules/appSettings/appSettings.types";

export const findGameByTitle = async (query: string) => {
	try {
		const result = await pool.query(
			`SELECT app_id, name FROM games
       WHERE name ILIKE $1
       ORDER BY similarity(name, $2) DESC
       LIMIT 10;`,
			[`%${query}%`, query],
		);

		return result.rows;
	} catch (error) {
		return [];
	}
};

export const findGameById = async (appId: string) => {
	try {
		const gameResult = await pool.query(
			`SELECT * FROM games
			JOIN game_assets ON games.app_id = game_assets.game_id
			JOIN game_platforms on games.app_id = game_platforms.game_id
			JOIN game_reviews_summary ON games.app_id = game_reviews_summary.game_id
        		WHERE app_id = $1;`,
			[appId],
		);
		const tagResult = await pool.query(
			`SELECT tags.name, game_tags.weight, tags.id FROM game_tags
			JOIN tags ON game_tags.tag_id = tags.id
        		WHERE game_id = $1
			ORDER BY game_tags.weight DESC;`,
			[appId],
		);
		const developerResult = await pool.query(
			`SELECT developers.name, developers.id FROM game_developers
			JOIN developers ON game_developers.developer_id = developers.id
        		WHERE game_id = $1;`,
			[appId],
		);
		const publisherResult = await pool.query(
			`SELECT publishers.name, publishers.id FROM game_publishers
			JOIN publishers ON game_publishers.publisher_id = publishers.id
        		WHERE game_id = $1;`,
			[appId],
		);
		const languageResult = await pool.query(
			`SELECT languages.code, languages.name, game_supported_languages.supported, game_supported_languages.full_audio, game_supported_languages.subtitles FROM game_supported_languages
			JOIN languages ON game_supported_languages.elanguage = languages.id
        		WHERE game_id = $1;`,
			[appId],
		);
		return {
			game: gameResult.rows[0],
			tags: tagResult.rows as gameTags,
			developers: developerResult.rows as gameDevelopers,
			publishers: publisherResult.rows as gamePublishers,
			languages: languageResult.rows as gameLanguages,
		};
	} catch (error) {
		console.error(error);
		return null;
	}
};

type aggregationFragment = {
	bucketSql: string;
	valueSql: string;
	joinSql?: string;
};

// Builds the parameterized WHERE clause shared by every chart aggregation query
const buildChartFilterSql = (filters?: chartFilters): chartFilterSql => {
	const clauses: string[] = [];
	const params: chartFilterSql["params"] = [];

	const addParam = (value: chartFilterSql["params"][number]) => {
		params.push(value);
		return `$${params.length}`;
	};

	if (!filters) {
		return { whereSql: "", params };
	}

	if (filters.release_date?.min) {
		clauses.push(
			`games.steam_release_date >= ${addParam(filters.release_date.min)}::timestamp`,
		);
	}
	if (filters.release_date?.max) {
		clauses.push(
			`games.steam_release_date <= ${addParam(filters.release_date.max)}::timestamp`,
		);
	}

	if (filters.price?.min != null) {
		clauses.push(`games.price_in_cents >= ${addParam(filters.price.min)}`);
	}
	if (filters.price?.max != null) {
		clauses.push(`games.price_in_cents <= ${addParam(filters.price.max)}`);
	}

	if (filters.is_demo != null) {
		clauses.push(
			filters.is_demo
				? `games.type = 1`
				: `(games.type IS NULL OR games.type <> 1)`,
		);
	}

	if (filters.tags?.length) {
		const tagsExistSql = `EXISTS (
                    SELECT 1 FROM game_tags filter_tags
                    WHERE filter_tags.game_id = games.app_id
                    AND filter_tags.tag_id = ANY(${addParam(filters.tags)}::int[])
                )`;
		clauses.push(
			filters.tags_mode === "exclude" ? `NOT ${tagsExistSql}` : tagsExistSql,
		);
	}

	if (filters.languages?.length) {
		const languagesExistSql = `EXISTS (
                    SELECT 1 FROM game_supported_languages filter_languages
                    WHERE filter_languages.game_id = games.app_id
                    AND filter_languages.supported = true
                    AND filter_languages.elanguage = ANY(${addParam(filters.languages)}::int[])
                )`;
		clauses.push(
			filters.languages_mode === "exclude"
				? `NOT ${languagesExistSql}`
				: languagesExistSql,
		);
	}

	if (filters.percent_positive?.min != null) {
		clauses.push(
			`reviews.percent_positive >= ${addParam(filters.percent_positive.min)}`,
		);
	}
	if (filters.percent_positive?.max != null) {
		clauses.push(
			`reviews.percent_positive <= ${addParam(filters.percent_positive.max)}`,
		);
	}

	if (filters.review_count?.min != null) {
		clauses.push(`reviews.review_count >= ${addParam(filters.review_count.min)}`);
	}
	if (filters.review_count?.max != null) {
		clauses.push(`reviews.review_count <= ${addParam(filters.review_count.max)}`);
	}

	return {
		whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
		params,
	};
};

// The per-game columns every chart query carries into its CTE. Extracted so
// the four query templates below cannot drift apart from one another.
const perGameColumnsSql = (est: estimationSql): string => `
                reviews.review_score AS review_score,
                reviews.percent_positive AS percent_positive,
                reviews.review_count AS review_count,
                games.price_in_cents AS price_in_cents,
                ${est.unitsSql} AS estimated_units,
                ${est.unitsLowSql} AS estimated_units_low,
                ${est.unitsHighSql} AS estimated_units_high,
                ${est.revenueSql} AS estimated_revenue_in_cents`;

// The columns carried forward when the numeric templates re-select from their
// first CTE. Mirrors perGameColumnsSql by alias.
const carriedColumnsSql = `
                    value,
                    review_score,
                    percent_positive,
                    review_count,
                    price_in_cents,
                    estimated_units,
                    estimated_units_low,
                    estimated_units_high,
                    estimated_revenue_in_cents`;

const AGGREGATED_COLUMNS = [
	"value",
	"review_score",
	"percent_positive",
	"review_count",
	"price_in_cents",
	"estimated_units",
	"estimated_units_low",
	"estimated_units_high",
	"estimated_revenue_in_cents",
] as const;

// aggregate_value keeps its historical name; every other column is prefixed
const aggregateAlias = (column: string): string =>
	column === "value" ? "aggregate_value" : `aggregate_${column}`;

const aggregateColumnsSql = (aggregate: "average" | "median"): string =>
	AGGREGATED_COLUMNS.map((column) =>
		aggregate === "median"
			? `ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${column}))::numeric, 2) AS ${aggregateAlias(column)}`
			: // Cast inside ROUND: the estimate columns are double precision,
				// which has no two-argument ROUND
				`ROUND(AVG(${column})::numeric, 2) AS ${aggregateAlias(column)}`,
	).join(",\n                ");

// Prefixes the estimate's tag-multiplier CTE, which is absent when no tag
// multipliers are configured
const withClause = (est: estimationSql): string =>
	est.cteSql ? `WITH ${est.cteSql},` : "WITH";

const aggregationFragments = (
	tagsCounted: number | null | undefined,
	est: estimationSql,
) =>
	({
		review_count: {
			bucketSql: ``,
			valueSql: `reviews.review_count::numeric`,
		},
		review_score: {
			bucketSql: ``,
			valueSql: `reviews.review_score::numeric`,
		},
		release_date: {
			bucketSql: ``,
			valueSql: `EXTRACT(EPOCH FROM games.steam_release_date)::numeric`,
		},
		price: {
			bucketSql: ``,
			valueSql: `games.price_in_cents::numeric`,
		},
		tag: {
			bucketSql: `COALESCE(tags.name, 'Unknown')`,
			valueSql: `COALESCE(tags.id, 0)::numeric`,
			joinSql: `LEFT JOIN LATERAL (
                  SELECT tag_id 
                  FROM game_tags 
                  WHERE game_tags.game_id = games.app_id 
                  ORDER BY weight DESC 
                  LIMIT ${tagsCounted ?? 10}
              ) top_tags ON true 
              LEFT JOIN tags ON top_tags.tag_id = tags.id`,
		},
		supported_languages: {
			bucketSql: `COALESCE(languages.name, 'Unknown')`,
			valueSql: `COALESCE(languages.id, 0)::numeric`,
			joinSql: `LEFT JOIN game_supported_languages ON games.app_id = game_supported_languages.game_id 
				  LEFT JOIN languages ON game_supported_languages.elanguage = languages.id`,
		},
		developer: {
			bucketSql: `COALESCE(developers.name, 'Unknown')`,
			valueSql: `COALESCE(developers.id, 0)::numeric`,
			joinSql: `LEFT JOIN game_developers ON games.app_id = game_developers.game_id 
				  LEFT JOIN developers ON game_developers.developer_id = developers.id`,
		},
		publisher: {
			bucketSql: `COALESCE(publishers.name, 'Unknown')`,
			valueSql: `COALESCE(publishers.id, 0)::numeric`,
			joinSql: `LEFT JOIN game_publishers ON games.app_id = game_publishers.game_id 
				  LEFT JOIN publishers ON game_publishers.publisher_id = publishers.id`,
		},
		category: {
			bucketSql: `COALESCE(categories.name, 'Unknown')`,
			valueSql: `COALESCE(categories.id, 0)::numeric`,
			joinSql: `LEFT JOIN game_categories ON games.app_id = game_categories.game_id 
				  LEFT JOIN categories ON game_categories.category_id = categories.id`,
		},
		has_demo: {
			bucketSql: `CASE WHEN EXISTS (SELECT 1 FROM games demo_games WHERE demo_games.parent_app_id = games.app_id) THEN 'Yes' WHEN games.type = 1 THEN 'Is Demo' ELSE 'No' END`,
			valueSql: `CASE WHEN EXISTS (SELECT 1 FROM games demo_games WHERE demo_games.parent_app_id = games.app_id) THEN 2 WHEN games.type = 1 THEN 1 ELSE 0 END::numeric`,
		},
		estimated_units: {
			bucketSql: ``,
			valueSql: `${est.unitsSql}::numeric`,
		},
		estimated_revenue: {
			bucketSql: ``,
			valueSql: `${est.revenueSql}::numeric`,
		},
	}) satisfies Record<
		chartAggregationMode,
		{ bucketSql: string; valueSql: string; joinSql?: string }
	>;

const getBucketSize = (bucketSize: number | undefined | null) => {
	if (bucketSize == null || Number.isNaN(bucketSize)) {
		return CHART_BUCKET_MIN;
	}

	return Math.min(CHART_BUCKET_MAX, Math.max(CHART_BUCKET_MIN, bucketSize));
};

// Average and median differ only in how the outer SELECT aggregates, so both
// share one pair of templates.
const buildAggregationQuery = (
	fragment: aggregationFragment,
	isNumericMode: boolean,
	normalizedBucketSize: number,
	whereSql: string,
	est: estimationSql,
	aggregate: "average" | "median",
): string => {
	const selectColumns = aggregateColumnsSql(aggregate);

	return isNumericMode
		? `${withClause(est)} numeric_games AS (
                SELECT
                    ${fragment.valueSql} AS value,
                    ${perGameColumnsSql(est)}
                FROM games
                LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
                ${est.joinSql}
                ${fragment.joinSql || ""}
                ${whereSql}
            ),
            aggregated_games AS (
                SELECT
                    FLOOR(value / ${normalizedBucketSize}) * ${normalizedBucketSize} AS bucket,
                    ${carriedColumnsSql}
                FROM numeric_games
            )
            SELECT
                bucket::text AS bucket,
                COUNT(*)::int AS count,
                MIN(value)::numeric AS min_value,
                MAX(value)::numeric AS max_value,
                ${selectColumns}
            FROM aggregated_games
            GROUP BY bucket
            ORDER BY min_value ASC;`
		: `${withClause(est)} aggregated_games AS (
                SELECT
                    ${fragment.bucketSql} AS bucket,
                    ${fragment.valueSql} AS value,
                    ${perGameColumnsSql(est)}
                FROM games
                LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
                ${est.joinSql}
                ${fragment.joinSql || ""}
                ${whereSql}
            )
            SELECT
                bucket::text AS bucket,
                COUNT(*)::int AS count,
                MIN(value)::numeric AS min_value,
                MAX(value)::numeric AS max_value,
                ${selectColumns}
            FROM aggregated_games
            GROUP BY bucket
            ORDER BY min_value ASC;`;
};

export const getGameChartAggregation = async (
	mode: chartAggregationMode,
	bucketSize: number | null | undefined,
	aggregate: "average" | "median",
	tagsCounted: number | null | undefined,
	filters: chartFilters | undefined,
	est: estimationSql,
) => {
	const fragment = aggregationFragments(tagsCounted, est)[mode];
	let normalizedBucketSize = getBucketSize(bucketSize);
	const numericBucketModes = [
		"review_count",
		"review_score",
		"release_date",
		"price",
		"estimated_units",
		"estimated_revenue",
	] as const;
	const isNumericMode = numericBucketModes.includes(
		mode as (typeof numericBucketModes)[number],
	);

	if (mode === "release_date" && normalizedBucketSize !== null) {
		//1 unit = 1 day, convert to seconds for epoch time
		normalizedBucketSize *= 86400;
	}

	const { whereSql, params } = buildChartFilterSql(filters);

	const result = await pool.query(
		buildAggregationQuery(
			fragment,
			isNumericMode,
			normalizedBucketSize,
			whereSql,
			est,
			aggregate,
		),
		params,
	);

	return {
		mode,
		aggregate,
		bucket_size: normalizedBucketSize,
		points: result.rows as chartAggregationPoint[],
	} satisfies chartAggregationResponse;
};

export const findAllTags = async () => {
	try {
		const result = await pool.query(
			`SELECT id, name FROM tags ORDER BY name ASC;`,
		);

		return result.rows as tagOption[];
	} catch (error) {
		return [];
	}
};

export const findAllLanguages = async () => {
	try {
		const result = await pool.query(
			`SELECT id, code, name FROM languages ORDER BY name ASC;`,
		);

		return result.rows as languageOption[];
	} catch (error) {
		return [];
	}
};
