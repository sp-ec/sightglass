import { backgroundPool } from "@/sql/db";

const TODAY_UTC = "(NOW() AT TIME ZONE 'UTC')::date";

// Check and increment in one statement, so concurrent callers can never push
// the count past the limit. No row comes back when the limit is already hit.
export const reserveApiRequest = async (limit: number): Promise<boolean> => {
	const result = await backgroundPool.query(
		`INSERT INTO steam_api_usage (usage_date, request_count)
		VALUES (${TODAY_UTC}, 1)
		ON CONFLICT (usage_date) DO UPDATE
		SET request_count = steam_api_usage.request_count + 1
		WHERE steam_api_usage.request_count < $1
		RETURNING request_count;`,
		[limit],
	);

	return (result.rowCount ?? 0) > 0;
};

export const getTodayUsage = async (): Promise<number> => {
	const result = await backgroundPool.query(
		`SELECT request_count FROM steam_api_usage WHERE usage_date = ${TODAY_UTC};`,
	);

	return (result.rows[0]?.request_count as number | undefined) ?? 0;
};
