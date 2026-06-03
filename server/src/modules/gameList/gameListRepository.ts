import pool from "../../config/db";

export type GameRecord = {
	app_id: number;
	name: string;
	last_modified?: number;
};

export const upsertGames = async (games: GameRecord[]) => {
	if (games.length === 0) {
		return { processedCount: 0 };
	}

	console.log("Upserting game count:", games.length);

	let processedCount = 0;
	// 10,000 rows * 3 params = 30,000 params (safely below the 65,535 limit)
	const CHUNK_SIZE = 10000;

	for (let i = 0; i < games.length; i += CHUNK_SIZE) {
		const chunk = games.slice(i, i + CHUNK_SIZE);

		const values = chunk
			.map((_, index) => {
				const appIdParam = index * 3 + 1;
				const nameParam = index * 3 + 2;
				const lastModifiedParam = index * 3 + 3;

				return `($${appIdParam}, $${nameParam}, $${lastModifiedParam})`;
			})
			.join(", ");

		const params = chunk.flatMap((game) => [
			game.app_id,
			game.name,
			game.last_modified ? new Date(game.last_modified) : null,
		]);

		const result = await pool.query(
			`
        insert into games (app_id, name, last_modified)
        values ${values}
        on conflict (app_id) do update
        set name = excluded.name,
            last_modified = excluded.last_modified
      `,
			params,
		);

		processedCount += result.rowCount ?? 0;
	}

	console.log("Upserted games:", processedCount);

	return { processedCount };
};
