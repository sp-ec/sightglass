import pool from "./db";

export const bulkUpsert = async (
	table: string,
	columns: string[],
	data: any[][],
	conflictClause: string,
) => {
	if (data.length === 0) return [];

	const values: string[] = [];
	const flatParams: any[] = [];
	let paramIdx = 1;

	for (const row of data) {
		const rowTokens: string[] = [];
		for (const val of row) {
			rowTokens.push(`$${paramIdx++}`);
			flatParams.push(val);
		}
		values.push(`(${rowTokens.join(", ")})`);
	}

	const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${values.join(", ")} ${conflictClause}`;
	const res = await pool.query(query, flatParams);
	return res.rows;
};

export const unixToTimestamp = (value: number | null | undefined) =>
	value == null ? null : new Date(value * 1000);

export const chunkArray = <T>(array: T[], size: number): T[][] => {
	const chunks = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
};