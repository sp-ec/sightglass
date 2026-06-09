import pool from "@/sql/db";
import { type GameTitle } from "../gameListTypes";

export const upsertGameTitles = async (games: GameTitle[]) => {
	if (games.length === 0) {
		return { processedCount: 0 };
	}

	let processedCount = 0;

	// 10,000 rows * 2 params = 20,000 params
	const CHUNK_SIZE = 10000;

	for (let i = 0; i < games.length; i += CHUNK_SIZE) {
		const chunk = games.slice(i, i + CHUNK_SIZE);

		const values = chunk
			.map((_, index) => {
				const appIdParam = index * 2 + 1;
				const nameParam = index * 2 + 2;

				return `($${appIdParam}, $${nameParam})`;
			})
			.join(", ");

		const params = chunk.flatMap((game) => [game.app_id, game.name]);

		const result = await pool.query(
			`
		INSERT INTO games (app_id, name)
		VALUES ${values}
		ON CONFLICT (app_id) DO UPDATE
		SET name = excluded.name
			`,
			params,
		);

		processedCount += result.rowCount ?? 0;
	}

	console.log("Upserted game titles:", processedCount);

	return { processedCount };
};
