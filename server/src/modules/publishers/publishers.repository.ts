import pool from "@/sql/db";
import {
	publisherListEntry,
	publisherListFilters,
	publisherListSort,
} from "./publishers.types";
import { sortOrder } from "@/modules/games/games.types";

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
