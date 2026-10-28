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
	CHART_METRICS,
	chartMetric,
	gameListItem,
	gameListSort,
	sortOrder,
	relatedApp,
} from "./games.types";

// Errors in the games read functions propagate so the controller answers 500;
// returning an empty result would make an outage look like "no results".
export const findGameByTitle = async (query: string) => {
	const result = await pool.query(
		`SELECT app_id, name FROM games
       WHERE name ILIKE $1
       ORDER BY similarity(name, $2) DESC
       LIMIT 10;`,
		[`%${query}%`, query],
	);

	return result.rows;
};

export const findGameById = async (appId: number) => {
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
};

// Matches on substring or trigram similarity. Both are served by
// games_name_trgm_idx; an empty search matches everything.
const listSearchSql = (param: string) =>
	`(${param}::text IS NULL OR games.name ILIKE '%' || ${param} || '%' OR games.name % ${param})`;

// The list shares the chart filters; the search param is numbered after theirs
const buildListWhereSql = (
	search: string | null,
	filters: chartFilters | undefined,
) => {
	const { whereSql, params } = buildChartFilterSql(filters);
	params.push(search);
	const searchParam = `$${params.length}`;
	const searchSql = listSearchSql(searchParam);

	return {
		whereSql: whereSql ? `${whereSql} AND ${searchSql}` : `WHERE ${searchSql}`,
		searchParam,
		params,
	};
};

// Rows synced before unixToTimestamp mapped Steam's 0 to NULL hold the epoch,
// shifted to 1969-12-31 by the sync's local timezone. Both read as unknown.
export const LIST_RELEASE_DATE_SQL = `CASE WHEN games.steam_release_date > '1970-01-01' THEN games.steam_release_date END`;

// A game's five heaviest tag names as top_tags.names, for a LEFT JOIN LATERAL
export const topTagNamesLateralSql = (gameIdSql: string): string => `(
			SELECT array_agg(tags.name ORDER BY ranked.weight DESC, ranked.tag_id ASC) AS names
			FROM (
				SELECT tag_id, weight
				FROM game_tags
				WHERE game_tags.game_id = ${gameIdSql}
				ORDER BY weight DESC, tag_id ASC
				LIMIT 5
			) ranked
			JOIN tags ON tags.id = ranked.tag_id
		) top_tags`;

// Sort keys map to fixed column names, so no client input reaches ORDER BY
const LIST_SORT_COLUMNS: Record<Exclude<gameListSort, "relevance">, string> = {
	review_count: "review_count",
	percent_positive: "percent_positive",
	release_date: "steam_release_date",
	price: "price_in_cents",
	name: "name",
};

// Missing values sort last in either order. Ties fall back to the most
// reviewed, then app_id, so a row never appears on two pages.
const listOrderSql = (
	sort: gameListSort,
	order: sortOrder,
	prefix: string,
): string => {
	const primary =
		sort === "relevance"
			? `${prefix}rank DESC`
			: `${prefix}${LIST_SORT_COLUMNS[sort]} ${order === "asc" ? "ASC" : "DESC"} NULLS LAST`;

	return `${primary}, ${prefix}review_count DESC NULLS LAST, ${prefix}app_id ASC`;
};

export const findGamesList = async (
	search: string | null,
	filters: chartFilters | undefined,
	sort: gameListSort,
	order: sortOrder,
	limit: number,
	offset: number,
): Promise<gameListItem[]> => {
	const { whereSql, searchParam, params } = buildListWhereSql(search, filters);
	params.push(limit, offset);
	const limitParam = `$${params.length - 1}`;
	const offsetParam = `$${params.length}`;

	// The page is picked before assets and tags are attached, so OFFSET skips
	// bare rows instead of fully built ones. rank carries the sort out of it.
	const result = await pool.query(
		`SELECT
			page.app_id,
			page.name,
			page.short_description,
			page.type,
			page.parent_app_id,
			game_assets.asset_url_format,
			game_assets.main_capsule,
			game_assets.small_capsule,
			game_assets.header,
			page.review_count,
			page.percent_positive,
			page.review_score,
			page.review_score_label,
			page.steam_release_date,
			page.price_in_cents,
			COALESCE(top_tags.names, ARRAY[]::text[]) AS tags
		FROM (
			SELECT
				games.app_id,
				games.name,
				games.short_description,
				games.type,
				games.parent_app_id,
				${LIST_RELEASE_DATE_SQL} AS steam_release_date,
				games.price_in_cents,
				reviews.review_count,
				reviews.percent_positive,
				reviews.review_score,
				reviews.review_score_label,
				CASE WHEN ${searchParam}::text IS NULL THEN 0 ELSE similarity(games.name, ${searchParam}) END AS rank
			FROM games
			LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
			${whereSql}
			ORDER BY ${listOrderSql(sort, order, "")}
			LIMIT ${limitParam} OFFSET ${offsetParam}
		) page
		LEFT JOIN game_assets ON game_assets.game_id = page.app_id
		LEFT JOIN LATERAL ${topTagNamesLateralSql("page.app_id")} ON TRUE
		ORDER BY ${listOrderSql(sort, order, "page.")};`,
		params,
	);

	return result.rows as gameListItem[];
};

// The reviews join is dropped by the planner when no review filter uses it
export const countGamesList = async (
	search: string | null,
	filters: chartFilters | undefined,
): Promise<number> => {
	const { whereSql, params } = buildListWhereSql(search, filters);
	const result = await pool.query(
		`SELECT COUNT(*)::int AS count FROM games
		LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
		${whereSql};`,
		params,
	);

	return (result.rows[0]?.count as number) ?? 0;
};

// A demo points at its parent; a full game is pointed at by its demo
export const findRelatedApps = async (
	appId: number,
	parentAppId: number | null,
): Promise<{ parent: relatedApp | null; demo: relatedApp | null }> => {
	const [parent, demo] = await Promise.all([
		parentAppId
			? pool.query(`SELECT app_id, name FROM games WHERE app_id = $1;`, [
					parentAppId,
				])
			: Promise.resolve({ rows: [] }),
		pool.query(
			`SELECT app_id, name FROM games
			WHERE parent_app_id = $1 AND type = 1
			ORDER BY app_id ASC
			LIMIT 1;`,
			[appId],
		),
	]);

	return {
		parent: (parent.rows[0] as relatedApp) ?? null,
		demo: (demo.rows[0] as relatedApp) ?? null,
	};
};

type aggregationFragment = {
	bucketSql: string;
	valueSql: string;
	joinSql?: string;
	// Resolves a bucket key to its display name once per group, after grouping,
	// instead of joining the name table once per game row
	lookup?: { bucketSql: string; joinSql: string };
	// Keeps only the largest buckets by game count, for modes with a long tail
	bucketLimit?: number;
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

// Estimates are precomputed per game by the appSettings rebuild. A game synced
// since the last rebuild has no row yet, so its estimate columns read NULL.
const ESTIMATES_JOIN_SQL = `LEFT JOIN game_estimates ON game_estimates.game_id = games.app_id`;

// The per-game columns every chart query carries into its CTE. Extracted so
// the two query templates below cannot drift apart from one another.
const PER_GAME_COLUMNS_SQL = `
                reviews.review_score AS review_score,
                reviews.percent_positive AS percent_positive,
                reviews.review_count AS review_count,
                games.price_in_cents AS price_in_cents,
                game_estimates.estimated_units,
                game_estimates.estimated_units_low,
                game_estimates.estimated_units_high,
                game_estimates.estimated_revenue_in_cents,
                game_estimates.estimated_revenue_low_in_cents,
                game_estimates.estimated_revenue_high_in_cents`;

// The columns carried forward when the numeric templates re-select from their
// first CTE. Mirrors PER_GAME_COLUMNS_SQL by alias.
const carriedColumnsSql = `
                    value,
                    review_score,
                    percent_positive,
                    review_count,
                    price_in_cents,
                    estimated_units,
                    estimated_units_low,
                    estimated_units_high,
                    estimated_revenue_in_cents,
                    estimated_revenue_low_in_cents,
                    estimated_revenue_high_in_cents`;

// aggregate_value keeps its historical name; every other column is prefixed
const aggregateAlias = (column: string): string =>
	column === "value" ? "aggregate_value" : `aggregate_${column}`;

// Each median is its own sort, so medians are computed only for the requested
// metrics and the rest read NULL. Averages share one pass and are always computed.
const aggregateColumnsSql = (
	aggregate: "average" | "median",
	metrics: readonly chartMetric[] = CHART_METRICS,
): string =>
	CHART_METRICS.map((column) => {
		if (aggregate === "average") {
			// Cast inside ROUND: the estimate columns are double precision,
			// which has no two-argument ROUND
			return `ROUND(AVG(${column})::numeric, 2) AS ${aggregateAlias(column)}`;
		}

		return metrics.includes(column)
			? `ROUND((PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${column}))::numeric, 2) AS ${aggregateAlias(column)}`
			: `NULL::numeric AS ${aggregateAlias(column)}`;
	}).join(",\n                ");

// The grouped_games columns the categorical template passes through untouched
const groupedColumnsSql = ["count", "min_value", "max_value"]
	.concat(CHART_METRICS.map(aggregateAlias))
	.map((column) => `grouped_games.${column}`)
	.join(",\n                ");

// Developer and publisher charts otherwise return tens of thousands of buckets
const TOP_BUCKET_LIMIT = 50;

const aggregationFragments = (tagsCounted: number) =>
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
			bucketSql: `top_tags.tag_id`,
			valueSql: `COALESCE(top_tags.tag_id, 0)::numeric`,
			joinSql: `LEFT JOIN LATERAL (
                  SELECT tag_id
                  FROM game_tags
                  WHERE game_tags.game_id = games.app_id
                  ORDER BY weight DESC, tag_id ASC
                  LIMIT ${tagsCounted}
              ) top_tags ON true`,
			// Untagged games read 'Unknown'; tag ids missing from tags keep their own bucket
			lookup: {
				bucketSql: `COALESCE(tags.name, 'Unknown tag ' || grouped_games.bucket, 'Unknown')`,
				joinSql: `LEFT JOIN tags ON tags.id = grouped_games.bucket`,
			},
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
			bucketLimit: TOP_BUCKET_LIMIT,
		},
		publisher: {
			bucketSql: `COALESCE(publishers.name, 'Unknown')`,
			valueSql: `COALESCE(publishers.id, 0)::numeric`,
			joinSql: `LEFT JOIN game_publishers ON games.app_id = game_publishers.game_id 
				  LEFT JOIN publishers ON game_publishers.publisher_id = publishers.id`,
			bucketLimit: TOP_BUCKET_LIMIT,
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
			valueSql: `game_estimates.estimated_units::numeric`,
		},
		estimated_revenue: {
			bucketSql: ``,
			valueSql: `game_estimates.estimated_revenue_in_cents::numeric`,
		},
	}) satisfies Record<
		chartAggregationMode,
		aggregationFragment
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
	aggregate: "average" | "median",
	metrics: readonly chartMetric[] | undefined,
): string => {
	const selectColumns = aggregateColumnsSql(aggregate, metrics);

	return isNumericMode
		? `WITH numeric_games AS (
                SELECT
                    ${fragment.valueSql} AS value,
                    ${PER_GAME_COLUMNS_SQL}
                FROM games
                LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
                ${ESTIMATES_JOIN_SQL}
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
		: `WITH aggregated_games AS (
                SELECT
                    ${fragment.bucketSql} AS bucket,
                    ${fragment.valueSql} AS value,
                    ${PER_GAME_COLUMNS_SQL}
                FROM games
                LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
                ${ESTIMATES_JOIN_SQL}
                ${fragment.joinSql || ""}
                ${whereSql}
            ),
            grouped_games AS (
                SELECT
                    bucket,
                    COUNT(*)::int AS count,
                    MIN(value)::numeric AS min_value,
                    MAX(value)::numeric AS max_value,
                    ${selectColumns}
                FROM aggregated_games
                GROUP BY bucket
                ${fragment.bucketLimit ? `ORDER BY count DESC, bucket ASC LIMIT ${fragment.bucketLimit}` : ""}
            )
            SELECT
                (${fragment.lookup?.bucketSql ?? "grouped_games.bucket"})::text AS bucket,
                ${groupedColumnsSql}
            FROM grouped_games
            ${fragment.lookup?.joinSql ?? ""}
            ORDER BY grouped_games.min_value ASC;`;
};

export const getGameChartAggregation = async (
	mode: chartAggregationMode,
	bucketSize: number | null | undefined,
	aggregate: "average" | "median",
	tagsCounted: number,
	filters: chartFilters | undefined,
	metrics: readonly chartMetric[] | undefined,
) => {
	const fragment = aggregationFragments(tagsCounted)[mode];
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
			aggregate,
			metrics,
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
	const result = await pool.query(
		`SELECT id, name FROM tags ORDER BY name ASC;`,
	);

	return result.rows as tagOption[];
};

export const findAllLanguages = async () => {
	const result = await pool.query(
		`SELECT id, code, name FROM languages ORDER BY name ASC;`,
	);

	return result.rows as languageOption[];
};
