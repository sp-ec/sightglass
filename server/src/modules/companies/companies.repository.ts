import pool from "@/sql/db";
import {
	companyConfig,
	companyGameRow,
	companyListEntry,
	companyListFilters,
	companyListSort,
	companySummary,
	companyTagCount,
} from "./companies.types";
import { sortOrder } from "@/modules/games/games.types";
import {
	LIST_RELEASE_DATE_SQL,
	topTagNamesLateralSql,
} from "@/modules/games/games.repository";

type listWhereSql = {
	whereSql: string;
	params: (number | string | null)[];
};

// Search matches on substring or trigram similarity, both served by the
// company table's name_trgm_idx
const buildListWhereSql = (
	{ companyTable, estimatesTable }: companyConfig,
	search: string | null,
	filters: companyListFilters | undefined,
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
			`(${companyTable}.name ILIKE '%' || ${searchParam} || '%' OR ${companyTable}.name % ${searchParam})`,
		);
	}

	if (filters?.revenue?.min != null) {
		clauses.push(
			`${estimatesTable}.total_revenue_in_cents >= ${addParam(filters.revenue.min)}`,
		);
	}
	if (filters?.revenue?.max != null) {
		clauses.push(
			`${estimatesTable}.total_revenue_in_cents <= ${addParam(filters.revenue.max)}`,
		);
	}

	if (filters?.games?.min != null) {
		clauses.push(
			`${estimatesTable}.games_published >= ${addParam(filters.games.min)}`,
		);
	}
	if (filters?.games?.max != null) {
		clauses.push(
			`${estimatesTable}.games_published <= ${addParam(filters.games.max)}`,
		);
	}

	return {
		whereSql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
		params,
	};
};

// Sort keys map to fixed column names, so no client input reaches ORDER BY
const listSortColumn = (
	{ companyTable, estimatesTable }: companyConfig,
	sort: companyListSort,
): string =>
	({
		total_revenue: `${estimatesTable}.total_revenue_in_cents`,
		median_revenue: `${estimatesTable}.median_revenue_in_cents`,
		average_revenue: `${estimatesTable}.average_revenue_in_cents`,
		games_published: `${estimatesTable}.games_published`,
		name: `${companyTable}.name`,
	})[sort];

// Ties fall back to id so a row never appears on two pages
const listOrderSql = (
	config: companyConfig,
	sort: companyListSort,
	order: sortOrder,
): string =>
	`${listSortColumn(config, sort)} ${order === "asc" ? "ASC" : "DESC"}, ${config.companyTable}.id ASC`;

// Inner join: a company with only demos, or synced since the last estimate
// rebuild, has no estimate row and is left out
const listFromSql = ({
	companyTable,
	estimatesTable,
	idColumn,
}: companyConfig): string => `FROM ${companyTable}
	JOIN ${estimatesTable} ON ${estimatesTable}.${idColumn} = ${companyTable}.id`;

const summaryColumnsSql = ({
	companyTable,
	estimatesTable,
}: companyConfig): string => `${companyTable}.id,
			${companyTable}.name,
			${estimatesTable}.games_published,
			${estimatesTable}.total_revenue_in_cents,
			${estimatesTable}.median_revenue_in_cents,
			${estimatesTable}.average_revenue_in_cents`;

// Errors propagate so the controller answers 500 rather than "no results"
export const findCompaniesList = async (
	config: companyConfig,
	search: string | null,
	filters: companyListFilters | undefined,
	sort: companyListSort,
	order: sortOrder,
	limit: number,
	offset: number,
): Promise<companyListEntry[]> => {
	const { whereSql, params } = buildListWhereSql(config, search, filters);
	params.push(limit, offset);

	const result = await pool.query(
		`SELECT ${summaryColumnsSql(config)}
		${listFromSql(config)}
		${whereSql}
		ORDER BY ${listOrderSql(config, sort, order)}
		LIMIT $${params.length - 1} OFFSET $${params.length};`,
		params,
	);

	return result.rows as companyListEntry[];
};

export const countCompaniesList = async (
	config: companyConfig,
	search: string | null,
	filters: companyListFilters | undefined,
): Promise<number> => {
	const { whereSql, params } = buildListWhereSql(config, search, filters);
	const result = await pool.query(
		`SELECT COUNT(*)::int AS count ${listFromSql(config)} ${whereSql};`,
		params,
	);

	return (result.rows[0]?.count as number) ?? 0;
};

// Left join so a company with no estimate row still loads, with null stats
export const findCompanySummary = async (
	config: companyConfig,
	companyId: number,
): Promise<companySummary | null> => {
	const { companyTable, estimatesTable, idColumn } = config;
	const result = await pool.query(
		`SELECT ${summaryColumnsSql(config)}
		FROM ${companyTable}
		LEFT JOIN ${estimatesTable} ON ${estimatesTable}.${idColumn} = ${companyTable}.id
		WHERE ${companyTable}.id = $1;`,
		[companyId],
	);

	return (result.rows[0] as companySummary) ?? null;
};

// Aliased company_games so it never collides with the per-game link laterals
const companyGamesFromSql = ({ linkTable }: companyConfig): string =>
	`FROM ${linkTable} company_games
	JOIN games ON games.app_id = company_games.game_id`;

// Demos are left out, matching the estimates rollup
const companyGamesWhereSql = ({ idColumn }: companyConfig): string =>
	`WHERE company_games.${idColumn} = $1
	AND (games.type IS NULL OR games.type <> 1)`;

export const findCompanyTagCounts = async (
	config: companyConfig,
	companyId: number,
): Promise<companyTagCount[]> => {
	const result = await pool.query(
		`SELECT tags.id, tags.name, COUNT(*)::int AS game_count
		${companyGamesFromSql(config)}
		JOIN game_tags ON game_tags.game_id = games.app_id
		JOIN tags ON tags.id = game_tags.tag_id
		${companyGamesWhereSql(config)}
		GROUP BY tags.id, tags.name
		ORDER BY game_count DESC, tags.name ASC;`,
		[companyId],
	);

	return result.rows as companyTagCount[];
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
export const findCompanyGames = async (
	config: companyConfig,
	companyId: number,
): Promise<companyGameRow[]> => {
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
		${companyGamesFromSql(config)}
		LEFT JOIN game_reviews_summary reviews ON reviews.game_id = games.app_id
		LEFT JOIN game_assets ON game_assets.game_id = games.app_id
		LEFT JOIN game_estimates ON game_estimates.game_id = games.app_id
		LEFT JOIN LATERAL ${topTagNamesLateralSql("games.app_id")} ON TRUE
		LEFT JOIN LATERAL ${companiesLateralSql("game_developers", "developers", "developer_id")} game_developer_list ON TRUE
		LEFT JOIN LATERAL ${companiesLateralSql("game_publishers", "publishers", "publisher_id")} game_publisher_list ON TRUE
		${companyGamesWhereSql(config)}
		ORDER BY game_estimates.estimated_revenue_in_cents DESC NULLS LAST, games.app_id ASC;`,
		[companyId],
	);

	return result.rows as companyGameRow[];
};
