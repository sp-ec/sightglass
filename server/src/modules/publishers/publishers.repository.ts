import pool from "@/sql/db";
import {
	publisherGameRow,
	publisherListEntry,
	publisherListFilters,
	publisherListSort,
	publisherSummary,
	publisherTagCount,
} from "./publishers.types";
import { sortOrder } from "@/modules/games/games.types";
import {
	LIST_RELEASE_DATE_SQL,
	topTagNamesLateralSql,
} from "@/modules/games/games.repository";

type listWhereSql = {
	whereSql: string;
	params: (number | string | null)[];
};

// Search matches on substring or trigram similarity, both served by
// publishers_name_trgm_idx
const buildListWhereSql = (
	search: string | null,
	filters: publisherListFilters | undefined,
): listWhereSql => {
	const clauses: string[] = [];
	const params: listWhereSql["params"] = [];

	const addParam = (value: number | string) => {
		params.push(value);
		return `$${params.length}`;
	};

	if (search) {
		const searchParam = addParam(search);
		clauses.push(
			`(publishers.name ILIKE '%' || ${searchParam} || '%' OR publishers.name % ${searchParam})`,
		);
	}

	if (filters?.revenue?.min != null) {
		clauses.push(
			`publisher_estimates.total_revenue_in_cents >= ${addParam(filters.revenue.min)}`,
		);
	}
	if (filters?.revenue?.max != null) {
		clauses.push(
			`publisher_estimates.total_revenue_in_cents <= ${addParam(filters.revenue.max)}`,
		);
	}

	if (filters?.games?.min != null) {
		clauses.push(
			`publisher_estimates.games_published >= ${addParam(filters.games.min)}`,
		);
	}
	if (filters?.games?.max != null) {
		clauses.push(
			`publisher_estimates.games_published <= ${addParam(filters.games.max)}`,
		);
	}

	return {
		whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
		params,
	};
};

// Sort keys map to fixed column names, so no client input reaches ORDER BY
const LIST_SORT_COLUMNS: Record<publisherListSort, string> = {
	total_revenue: "publisher_estimates.total_revenue_in_cents",
	median_revenue: "publisher_estimates.median_revenue_in_cents",
	average_revenue: "publisher_estimates.average_revenue_in_cents",
	games_published: "publisher_estimates.games_published",
	name: "publishers.name",
};

// Ties fall back to id so a row never appears on two pages
const listOrderSql = (sort: publisherListSort, order: sortOrder): string =>
	`${LIST_SORT_COLUMNS[sort]} ${order === "asc" ? "ASC" : "DESC"}, publishers.id ASC`;

// Inner join: a publisher with only demos, or synced since the last estimate
// rebuild, has no estimate row and is left out
const LIST_FROM_SQL = `FROM publishers
	JOIN publisher_estimates ON publisher_estimates.publisher_id = publishers.id`;

// Errors propagate so the controller answers 500 rather than "no results"
export const findPublishersList = async (
	search: string | null,
	filters: publisherListFilters | undefined,
	sort: publisherListSort,
	order: sortOrder,
	limit: number,
	offset: number,
): Promise<publisherListEntry[]> => {
	const { whereSql, params } = buildListWhereSql(search, filters);
	params.push(limit, offset);

	const result = await pool.query(
		`SELECT
			publishers.id,
			publishers.name,
			publisher_estimates.games_published,
			publisher_estimates.total_revenue_in_cents,
			publisher_estimates.median_revenue_in_cents,
			publisher_estimates.average_revenue_in_cents
		${LIST_FROM_SQL}
		${whereSql}
		ORDER BY ${listOrderSql(sort, order)}
		LIMIT $${params.length - 1} OFFSET $${params.length};`,
		params,
	);

	return result.rows as publisherListEntry[];
};

export const countPublishersList = async (
	search: string | null,
	filters: publisherListFilters | undefined,
): Promise<number> => {
	const { whereSql, params } = buildListWhereSql(search, filters);
	const result = await pool.query(
		`SELECT COUNT(*)::int AS count ${LIST_FROM_SQL} ${whereSql};`,
		params,
	);

	return (result.rows[0]?.count as number) ?? 0;
};

// Left join so a publisher with no estimate row still loads, with null stats
export const findPublisherSummary = async (
	publisherId: number,
): Promise<publisherSummary | null> => {
	const result = await pool.query(
		`SELECT
			publishers.id,
			publishers.name,
			publisher_estimates.games_published,
			publisher_estimates.total_revenue_in_cents,
			publisher_estimates.median_revenue_in_cents,
			publisher_estimates.average_revenue_in_cents
		FROM publishers
		LEFT JOIN publisher_estimates ON publisher_estimates.publisher_id = publishers.id
		WHERE publishers.id = $1;`,
		[publisherId],
	);

	return (result.rows[0] as publisherSummary) ?? null;
};

const PUBLISHER_GAMES_FROM_SQL = `FROM game_publishers
	JOIN games ON games.app_id = game_publishers.game_id`;

// Demos are left out, matching the publisher_estimates rollup
const PUBLISHER_GAMES_WHERE_SQL = `WHERE game_publishers.publisher_id = $1
	AND (games.type IS NULL OR games.type <> 1)`;

export const findPublisherTagCounts = async (
	publisherId: number,
): Promise<publisherTagCount[]> => {
	const result = await pool.query(
		`SELECT tags.id, tags.name, COUNT(*)::int AS game_count
		${PUBLISHER_GAMES_FROM_SQL}
		JOIN game_tags ON game_tags.game_id = games.app_id
		JOIN tags ON tags.id = game_tags.tag_id
		${PUBLISHER_GAMES_WHERE_SQL}
		GROUP BY tags.id, tags.name
		ORDER BY game_count DESC, tags.name ASC;`,
		[publisherId],
	);

	return result.rows as publisherTagCount[];
};

// A game's developers or publishers as a JSON array of { id, name }
const companiesLateralSql = (
	linkTable: string,
	companyTable: string,
	companyIdColumn: string,
): string => `(
			SELECT COALESCE(
				json_agg(json_build_object('id', companies.id, 'name', companies.name) ORDER BY companies.name),
				'[]'::json
			) AS list
			FROM ${linkTable} links
			JOIN ${companyTable} companies ON companies.id = links.${companyIdColumn}
			WHERE links.game_id = games.app_id
		)`;

// Games synced since the last estimate rebuild read NULL estimates and sort last
export const findPublisherGames = async (
	publisherId: number,
): Promise<publisherGameRow[]> => {
	const result = await pool.query(
		`SELECT
			games.app_id,
			games.name,
			${LIST_RELEASE_DATE_SQL} AS steam_release_date,
			games.price_in_cents,
			reviews.review_count,
			reviews.percent_positive,
			reviews.review_score,
			game_assets.asset_url_format,
			game_assets.small_capsule,
			game_assets.header,
			game_estimates.estimated_units,
			game_estimates.estimated_revenue_in_cents,
			COALESCE(top_tags.names, ARRAY[]::text[]) AS tags,
			game_developer_list.list AS developers,
			game_publisher_list.list AS publishers
		${PUBLISHER_GAMES_FROM_SQL}
		LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
		LEFT JOIN game_assets ON game_assets.game_id = games.app_id
		LEFT JOIN game_estimates ON game_estimates.game_id = games.app_id
		LEFT JOIN LATERAL ${topTagNamesLateralSql("games.app_id")} ON TRUE
		LEFT JOIN LATERAL ${companiesLateralSql("game_developers", "developers", "developer_id")} game_developer_list ON TRUE
		LEFT JOIN LATERAL ${companiesLateralSql("game_publishers", "publishers", "publisher_id")} game_publisher_list ON TRUE
		${PUBLISHER_GAMES_WHERE_SQL}
		ORDER BY game_estimates.estimated_revenue_in_cents DESC NULLS LAST, games.app_id ASC;`,
		[publisherId],
	);

	return result.rows as publisherGameRow[];
};
