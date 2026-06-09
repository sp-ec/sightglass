import pool from "@/sql/db";

export type TagRow = {
	tag: string;
	last_updated: Date;
};

// Get all tags from the database, ordered by tag name
export const getTags = async () => {
	const result = await pool.query<TagRow>(
		"SELECT tag, last_updated FROM tags ORDER BY tag ASC",
	);

	return result.rows;
};

// Upsert tags into the database, updating last_updated if the tag already exists
export const upsertTags = async (tags: string[]) => {
	if (tags.length === 0) {
		return { processedCount: 0 };
	}

	const uniqueTags = [...new Set(tags)];

	console.log(`Upserting ${uniqueTags.length} tags into database...`);

	const values = uniqueTags
		.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
		.join(", ");

	const params = uniqueTags.flatMap((tag, last_updated) => [tag, new Date()]);

	console.log(`Upserting tags with params:`, params);

	const result = await pool.query(
		`
      INSERT INTO tags (tag, last_updated)
      VALUES ${values}
      ON CONFLICT (tag) DO UPDATE
      SET last_updated = excluded.last_updated
    `,
		params,
	);

	return { processedCount: result.rowCount ?? 0 };
};

// Upsert games by tag into the database, merging with existing tags
export const upsertGamesByTag = async (
	tag: string,
	appTags: Record<string, Record<string, number>>,
) => {
	const entries = Object.entries(appTags);

	if (entries.length === 0) {
		return { processedCount: 0 };
	}

	console.log(`Upserting ${entries.length} games with tag "${tag}"...`);

	// Chunk the upsert to avoid hitting parameter limits, allowing for any input size
	let processedCount = 0;
	const CHUNK_SIZE = 5000;

	for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
		const chunk = entries.slice(i, i + CHUNK_SIZE);

		// We'll upsert more fields per game: positive, negative, owners_min/max, price, ccu, developer, publisher
		// Expect each value in appTags to be an object containing those properties. Owners is expected as a string range like "1,000 .. 2,000".
		function parseRange(rangeStr: string): [number, number] {
			const parts = rangeStr.split(" .. ");
			const min = parseInt(parts[0].replace(/,/g, ""), 10);
			const max = parseInt(parts[1].replace(/,/g, ""), 10);
			return [min, max];
		}

		function toDecimal(num: number): number {
			return num / 100;
		}

		const paramCount = 11; // app_id, positive, negative, owners_min, owners_max, price, ccu, developer, publisher, tags, last_updated

		const values = chunk
			.map((_, index) => {
				const base = index * paramCount;
				return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}::text[], $${base + 11})`;
			})
			.join(", ");

		const params: any[] = [];

		for (const [appId, detailsAny] of chunk) {
			// details may be typed as Record<string, any>
			const details: any = detailsAny as any;
			const positive = details.positive ?? null;
			const negative = details.negative ?? null;
			const owners =
				typeof details.owners === "string"
					? details.owners
					: details.owners_range || "0 .. 0";
			const [owners_min, owners_max] = parseRange(owners);
			const price =
				typeof details.price === "number" ? toDecimal(details.price) : null;
			const ccu = details.ccu ?? null;
			const developer = details.developer ?? null;
			const publisher = details.publisher ?? null;

			params.push(
				appId,
				positive,
				negative,
				owners_min,
				owners_max,
				price,
				ccu,
				developer,
				publisher,
				[tag],
				new Date(),
			);
		}

		const result = await pool.query(
			`
        INSERT INTO games (app_id, rating_positive, rating_negative, owners_min, owners_max, price, ccu, developer, publisher, tags, last_updated)
        VALUES ${values}
        ON CONFLICT (app_id) DO UPDATE
        SET rating_positive = excluded.rating_positive,
            rating_negative = excluded.rating_negative,
            owners_min = excluded.owners_min,
            owners_max = excluded.owners_max,
            price = excluded.price,
            ccu = excluded.ccu,
            developer = excluded.developer,
            publisher = excluded.publisher,
            tags = COALESCE(games.tags, '{}'::text[]) || excluded.tags,
            last_updated = excluded.last_updated
      `,
			params,
		);

		processedCount += result.rowCount ?? 0;
	}

	return { processedCount };
};
