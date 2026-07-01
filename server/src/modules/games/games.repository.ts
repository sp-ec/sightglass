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
	CHART_BUCKET_MIN,
	CHART_BUCKET_MAX,
} from "./games.types";

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

const aggregationFragments: Record<
	chartAggregationMode,
	{ bucketSql: string; valueSql: string; joinSql?: string }
> = {
	review_count: {
		bucketSql: `CASE
            WHEN reviews.review_count IS NULL THEN 'Unknown'
            WHEN reviews.review_count = 0 THEN '0'
            WHEN reviews.review_count < 100 THEN '1-99'
            WHEN reviews.review_count < 500 THEN '100-499'
            WHEN reviews.review_count < 1000 THEN '500-999'
            WHEN reviews.review_count < 5000 THEN '1k-4.9k'
            WHEN reviews.review_count < 10000 THEN '5k-9.9k'
            ELSE '10k+'
        END`,
		valueSql: `reviews.review_count::numeric`,
	},
	review_score: {
		bucketSql: `CASE
            WHEN reviews.review_score IS NULL THEN 'Unknown'
            WHEN reviews.review_score < 20 THEN '0-19'
            WHEN reviews.review_score < 40 THEN '20-39'
            WHEN reviews.review_score < 60 THEN '40-59'
            WHEN reviews.review_score < 80 THEN '60-79'
            ELSE '80-100'
        END`,
		valueSql: `reviews.review_score::numeric`,
	},
	release_date: {
		bucketSql: `TO_CHAR(DATE_TRUNC('month', games.steam_release_date), 'YYYY-MM')`,
		valueSql: `EXTRACT(EPOCH FROM games.steam_release_date)::numeric`,
	},
	price: {
		bucketSql: `CASE
            WHEN games.price_in_cents IS NULL THEN 'Unknown'
            WHEN games.price_in_cents = 0 THEN 'Free'
            WHEN games.price_in_cents < 500 THEN '$0.01-$4.99'
            WHEN games.price_in_cents < 1000 THEN '$5.00-$9.99'
            WHEN games.price_in_cents < 2000 THEN '$10.00-$19.99'
            WHEN games.price_in_cents < 3000 THEN '$20.00-$29.99'
            WHEN games.price_in_cents < 4000 THEN '$30.00-$39.99'
            WHEN games.price_in_cents < 5000 THEN '$40.00-$49.99'
            ELSE '$50.00+'
        END`,
		valueSql: `games.price_in_cents::numeric`,
	},
	tag: {
		bucketSql: `COALESCE(tags.name, 'Unknown')`,
		valueSql: `COALESCE(tags.id, 0)::numeric`,
		joinSql: `LEFT JOIN game_tags ON games.app_id = game_tags.game_id 
                  LEFT JOIN tags ON game_tags.tag_id = tags.id`,
	},
};

const getBucketSize = (bucketSize: number | undefined | null) => {
	if (bucketSize == null || Number.isNaN(bucketSize)) {
		return CHART_BUCKET_MIN;
	}

	return Math.min(CHART_BUCKET_MAX, Math.max(CHART_BUCKET_MIN, bucketSize));
};

export const getGameChartAggregation = async (
	mode: chartAggregationMode,
	bucketSize?: number | null,
) => {
	const fragment = aggregationFragments[mode];
	let normalizedBucketSize = getBucketSize(bucketSize);
	const numericBucketModes = [
		"review_count",
		"review_score",
		"release_date",
		"price",
	] as const;
	const isNumericMode = numericBucketModes.includes(
		mode as (typeof numericBucketModes)[number],
	);

	if (mode === "release_date" && normalizedBucketSize !== null) {
		//1 unit = 1 day, convert to seconds for epoch time
		normalizedBucketSize *= 86400;
	}

	const result = await pool.query(
		isNumericMode
			? `WITH numeric_games AS (
                SELECT
                    ${fragment.valueSql} AS value,
                    reviews.review_score AS review_score,
                    reviews.percent_positive AS percent_positive,
                    reviews.review_count AS review_count,
                    games.price_in_cents AS price_in_cents
                FROM games
                LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
                ${fragment.joinSql || ""}
            ),
            aggregated_games AS (
                SELECT
                    FLOOR(value / ${normalizedBucketSize}) * ${normalizedBucketSize} AS bucket,
                    value,
                    review_score,
                    percent_positive,
                    review_count,
                    price_in_cents
                FROM numeric_games
            )
            SELECT
                bucket::text AS bucket,
                COUNT(*)::int AS count,
                MIN(value)::numeric AS min_value,
                MAX(value)::numeric AS max_value,
                ROUND(AVG(value), 2)::numeric AS average_value,
                ROUND(AVG(review_score), 2)::numeric AS average_review_score,
                ROUND(AVG(percent_positive), 2)::numeric AS average_percent_positive,
                ROUND(AVG(review_count), 2)::numeric AS average_review_count,
                ROUND(AVG(price_in_cents), 2)::numeric AS average_price_in_cents
            FROM aggregated_games
            GROUP BY bucket
            ORDER BY min_value ASC;`
			: `WITH aggregated_games AS (
                SELECT
                    ${fragment.bucketSql} AS bucket,
                    ${fragment.valueSql} AS value,
                    reviews.review_score AS review_score,
                    reviews.percent_positive AS percent_positive,
                    reviews.review_count AS review_count,
                    games.price_in_cents AS price_in_cents
                FROM games
                LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
                ${fragment.joinSql || ""}
            )
            SELECT
                bucket::text AS bucket,
                COUNT(*)::int AS count,
                MIN(value)::numeric AS min_value,
                MAX(value)::numeric AS max_value,
                ROUND(AVG(value), 2)::numeric AS average_value,
                ROUND(AVG(review_score), 2)::numeric AS average_review_score,
                ROUND(AVG(percent_positive), 2)::numeric AS average_percent_positive,
                ROUND(AVG(review_count), 2)::numeric AS average_review_count,
                ROUND(AVG(price_in_cents), 2)::numeric AS average_price_in_cents
            FROM aggregated_games
            GROUP BY bucket
            ORDER BY min_value ASC;`,
	);

	return {
		mode,
		bucket_size: normalizedBucketSize,
		points: result.rows as chartAggregationPoint[],
	} satisfies chartAggregationResponse;
};