import pool from "@/sql/db";

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
