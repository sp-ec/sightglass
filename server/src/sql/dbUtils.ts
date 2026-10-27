import { backgroundPool } from "./db";

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
	const res = await backgroundPool.query(query, flatParams);
	return res.rows;
};

// Sends one array per column instead of one parameter per value, so row count
// is not bounded by Postgres's 65,535-parameter limit. columnTypes are the SQL
// element types, e.g. "int" or "boolean".
export const bulkUpsertUnnest = async (
	table: string,
	columns: string[],
	columnTypes: string[],
	data: any[][],
	conflictClause: string,
) => {
	if (data.length === 0) return [];

	const parallelArrays: any[][] = columns.map(() => []);
	for (const row of data) {
		row.forEach((val, i) => parallelArrays[i].push(val));
	}

	const unnestArgs = columnTypes
		.map((type, i) => `$${i + 1}::${type}[]`)
		.join(", ");

	const query = `INSERT INTO ${table} (${columns.join(", ")}) SELECT * FROM unnest(${unnestArgs}) ${conflictClause}`;
	const res = await backgroundPool.query(query, parallelArrays);
	return res.rows;
};

// Steam sends 0 for an unknown date, which would otherwise be stored as 1970
export const unixToTimestamp = (value: number | null | undefined) =>
	!value ? null : new Date(value * 1000);

export const chunkArray = <T>(array: T[], size: number): T[][] => {
	const chunks = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
};