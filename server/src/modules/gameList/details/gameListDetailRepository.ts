import pool from "@/config/db";
import { GameDetails } from "../gameListTypes";

function parseRange(rangeStr: string): [number, number] {
    const parts = rangeStr.split(" .. ");
    const min = parseInt(parts[0].replace(/,/g, ""), 10);
    const max = parseInt(parts[1].replace(/,/g, ""), 10);
    return [min, max];
}

function toDecimal(num: number): number {
    return num / 100;
}

function serializeTags(tags: Record<string, number>): string[] {
    return Object.keys(tags);
}

export const upsertGameDetails = async (games: GameDetails[]) => {
	const gamesArray = Object.values(games);

	if (gamesArray.length === 0) {
		return { processedCount: 0 };
	}

	//chunk the upsert to avoid hitting parameter limits, allowing for any input size
	let processedCount = 0;
	const CHUNK_SIZE = 2000;

	for (let i = 0; i < gamesArray.length; i += CHUNK_SIZE) {
		const chunk = gamesArray.slice(i, i + CHUNK_SIZE);
		const paramCount = 14;
		const values = chunk
			.map((_, index) => {
				const appIdParam = index * paramCount + 1;
				const nameParam = index * paramCount + 2;
				const developerParam = index * paramCount + 3;
				const publisherParam = index * paramCount + 4;
				const positiveParam = index * paramCount + 5;
				const negativeParam = index * paramCount + 6;
				const ownersMinParam = index * paramCount + 7;
				const ownersMaxParam = index * paramCount + 8;
				const priceParam = index * paramCount + 9;
				const ccuParam = index * paramCount + 10;
				const tagsParam = index * paramCount + 11;
				const genreParam = index * paramCount + 12;
				const languagesParam = index * paramCount + 13;
				const lastUpdatedParam = index * paramCount + 14;

				return `($${appIdParam}, $${nameParam}, $${developerParam}, $${publisherParam}, $${positiveParam}, $${negativeParam}, $${ownersMinParam}, $${ownersMaxParam}, $${priceParam}, $${ccuParam}, $${tagsParam}, $${genreParam}, $${languagesParam}, $${lastUpdatedParam})`;
			})
			.join(", ");

		const [owners_min, owners_max] = parseRange(chunk[0].owners);

		const params = chunk.flatMap((game) => [
			game.app_id,
			game.name,
			game.developer,
			game.publisher,
			game.positive,
			game.negative,
			owners_min,
			owners_max,
			toDecimal(game.price),
			game.ccu,
			serializeTags(game.tags),
			game.genre,
			game.languages.split(", "),
			new Date(),
		]);

		const result = await pool.query(
			`
		INSERT INTO games (app_id, name, developer, publisher, rating_positive, rating_negative, owners_min, owners_max, price, ccu, tags, genre, languages, last_updated)
		VALUES ${values}
		ON CONFLICT (app_id) DO UPDATE
		SET name = excluded.name,
			developer = excluded.developer,
			publisher = excluded.publisher,
			rating_positive = excluded.rating_positive,
			rating_negative = excluded.rating_negative,
			owners_min = excluded.owners_min,
			owners_max = excluded.owners_max,
			price = excluded.price,
			ccu = excluded.ccu,
			tags = excluded.tags,
			genre = excluded.genre,
			languages = excluded.languages,
			last_updated = excluded.last_updated
			`,
			params,
		);

		processedCount += result.rowCount ?? 0;
	}

	console.log("Upserted game details:", processedCount);

	return { processedCount };
};
