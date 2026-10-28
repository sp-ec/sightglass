import { backgroundPool } from "@/sql/db";
import {
	bulkUpsert,
	bulkUpsertUnnest,
	unixToTimestamp,
	chunkArray,
} from "@/sql/dbUtils";
import {
	cleanCompanyName,
	companyNameKey,
} from "@/modules/sync/companyNames";
import { companyMergeResult, companyTable } from "./sync.types";

const CHUNK_SIZE = 500;

// Keyed by companyNameKey so two spellings in one chunk become one insert row;
// otherwise the upsert would hit the same row twice and Postgres rejects that
const addCompanyName = (
	names: Map<string, string>,
	name: string | null | undefined,
) => {
	if (!name) return;
	const key = companyNameKey(name);
	if (key && !names.has(key)) {
		names.set(key, cleanCompanyName(name));
	}
};

// Returns the id for each name key. The no-op update makes RETURNING include
// rows that already exist, and leaves their stored name alone so it does not
// change with whichever spelling synced last.
const upsertCompanies = async (
	table: companyTable["table"],
	names: Map<string, string>,
): Promise<Map<string, number>> => {
	const ids = new Map<string, number>();
	if (names.size === 0) return ids;

	const rows = await bulkUpsert(
		table,
		["name", "name_key"],
		Array.from(names, ([key, name]) => [name, key]),
		"ON CONFLICT (name_key) DO UPDATE SET name_key = EXCLUDED.name_key RETURNING id, name_key",
	);
	for (const row of rows) ids.set(row.name_key, row.id);

	return ids;
};

const cleanUpRelations = async (
	table: string,
	gameIds: number[],
	columns: string[],
	validTuples: any[][],
) => {
	if (gameIds.length === 0) return;
	if (validTuples.length === 0) {
		await backgroundPool.query(`DELETE FROM ${table} WHERE game_id = ANY($1::int[])`, [
			gameIds,
		]);
		return;
	}

	// Pivot validTuples into parallel arrays to avoid AST stack depth limits
	const numColumns = validTuples[0].length;
	const parallelArrays: any[][] = Array.from({ length: numColumns }, () => []);

	for (const tuple of validTuples) {
		for (let i = 0; i < numColumns; i++) {
			parallelArrays[i].push(tuple[i]);
		}
	}

	// $1 is gameIds. Parallel arrays start at $2.
	const params = [gameIds, ...parallelArrays];
	const unnestArgs = parallelArrays
		.map((_, i) => `$${i + 2}::text[]`)
		.join(", ");
	const unnestAliases = ["keep_game_id", ...columns].join(", ");

	const matchConditions = [
		`${table}.game_id = (k.keep_game_id)::int`,
		...columns.map((c) => `${table}.${c}::text = k.${c}`),
	].join(" AND ");

	const query = `
    DELETE FROM ${table}
    WHERE game_id = ANY($1::int[])
    AND NOT EXISTS (
      SELECT 1 FROM unnest(${unnestArgs}) AS k(${unnestAliases})
      WHERE ${matchConditions}
    )
  `;

	await backgroundPool.query(query, params);
};

export const saveSteamGames = async (storeItems: any[]) => {
	const chunks = chunkArray(storeItems, CHUNK_SIZE);

	for (const chunk of chunks) {
		const gamesMap = new Map<number, any[]>();
		const reviewsMap = new Map<number, any[]>();
		const assetsMap = new Map<number, any[]>();
		const platformsMap = new Map<number, any[]>();
		const uniqueDevs = new Map<string, string>();
		const uniquePubs = new Map<string, string>();

		for (const item of chunk) {
			const appId = item.appid ?? item.id;
			const gameRating = item.game_rating ?? null;
			const bestPurchaseOption = item.best_purchase_option ?? null;
			const reviewSummary =
				item.reviews?.summary_filtered ??
				item.reviews?.summary_language_specific ??
				null;
			const assets = item.assets ?? null;
			const platforms = item.platforms ?? null;

			gamesMap.set(appId, [
				appId,
				item.name ?? null,
				item.type ?? null,
				item.related_items?.parent_appid ?? null,
				item.store_url_path ?? null,
				unixToTimestamp(item.release?.steam_release_date),
				bestPurchaseOption?.original_price_in_cents ??
					bestPurchaseOption?.final_price_in_cents ??
					0,
				item.basic_info?.short_description ?? null,
				gameRating?.type ?? null,
				gameRating?.rating ?? null,
				new Date(),
			]);

			reviewsMap.set(appId, [
				appId,
				reviewSummary?.review_count ?? null,
				reviewSummary?.percent_positive ?? null,
				reviewSummary?.review_score ?? null,
				reviewSummary?.review_score_label ?? null,
			]);

			assetsMap.set(appId, [
				appId,
				assets?.asset_url_format ?? null,
				assets?.main_capsule ?? null,
				assets?.small_capsule ?? null,
				assets?.header ?? null,
				assets?.page_background_path ?? null,
				assets?.hero_capsule ?? null,
				assets?.library_capsule ?? null,
				assets?.library_hero ?? null,
				assets?.community_icon ?? null,
			]);

			platformsMap.set(appId, [
				appId,
				platforms?.windows ?? false,
				platforms?.mac ?? false,
				platforms?.steamos_linux ?? false,
				platforms?.steam_deck_compat_category ?? null,
				platforms?.steam_os_compat_category ?? null,
			]);

			for (const dev of item.basic_info?.developers ?? []) {
				addCompanyName(uniqueDevs, dev.name);
			}
			for (const pub of item.basic_info?.publishers ?? []) {
				addCompanyName(uniquePubs, pub.name);
			}
		}

		const gamesData = Array.from(gamesMap.values());
		const reviewsData = Array.from(reviewsMap.values());
		const assetsData = Array.from(assetsMap.values());
		const platformsData = Array.from(platformsMap.values());
		const gameIds = gamesData.map((row) => row[0]);

		await bulkUpsert(
			"games",
			[
				"app_id",
				"name",
				"type",
				"parent_app_id",
				"store_url_path",
				"steam_release_date",
				"price_in_cents",
				"short_description",
				"rating_type",
				"rating",
				"last_updated",
			],
			gamesData,
			`ON CONFLICT (app_id) DO UPDATE SET
			name = EXCLUDED.name,
			type = EXCLUDED.type,
			parent_app_id = EXCLUDED.parent_app_id,
			store_url_path = EXCLUDED.store_url_path,
			steam_release_date = EXCLUDED.steam_release_date,
			price_in_cents = EXCLUDED.price_in_cents,
			short_description = EXCLUDED.short_description,
			rating_type = EXCLUDED.rating_type,
			rating = EXCLUDED.rating,
			last_updated = EXCLUDED.last_updated`,
		);

		await bulkUpsert(
			"game_reviews_summary",
			[
				"game_id",
				"review_count",
				"percent_positive",
				"review_score",
				"review_score_label",
			],
			reviewsData,
			`ON CONFLICT (game_id) DO UPDATE SET 
			review_count = EXCLUDED.review_count, 
			percent_positive = EXCLUDED.percent_positive, 
			review_score = EXCLUDED.review_score, 
			review_score_label = EXCLUDED.review_score_label`,
		);

		await bulkUpsert(
			"game_assets",
			[
				"game_id",
				"asset_url_format",
				"main_capsule",
				"small_capsule",
				"header",
				"page_background_path",
				"hero_capsule",
				"library_capsule",
				"library_hero",
				"community_icon",
			],
			assetsData,
			`ON CONFLICT (game_id) DO UPDATE SET
			asset_url_format = EXCLUDED.asset_url_format,
			main_capsule = EXCLUDED.main_capsule,
			small_capsule = EXCLUDED.small_capsule,
			header = EXCLUDED.header,
			page_background_path = EXCLUDED.page_background_path,
			hero_capsule = EXCLUDED.hero_capsule,
			library_capsule = EXCLUDED.library_capsule,
			library_hero = EXCLUDED.library_hero,
			community_icon = EXCLUDED.community_icon`,
		);

		await bulkUpsert(
			"game_platforms",
			[
				"game_id",
				"windows",
				"mac",
				"steamos_linux",
				"steam_deck_compat_category",
				"steam_os_compat_category",
			],
			platformsData,
			`ON CONFLICT (game_id) DO UPDATE SET
			windows = EXCLUDED.windows,
			mac = EXCLUDED.mac,
			steamos_linux = EXCLUDED.steamos_linux,
			steam_deck_compat_category = EXCLUDED.steam_deck_compat_category,
			steam_os_compat_category = EXCLUDED.steam_os_compat_category`,
		);

		const devMap = await upsertCompanies("developers", uniqueDevs);
		const pubMap = await upsertCompanies("publishers", uniquePubs);

		const devPairsMap = new Map<string, any[]>();
		const pubPairsMap = new Map<string, any[]>();
		const tagPairsMap = new Map<string, any[]>();
		const categoryPairsMap = new Map<string, any[]>();
		const languagePairsMap = new Map<string, any[]>();

		for (const item of chunk) {
			const appId = item.appid ?? item.id;

			// Variants of one company resolve to the same id, so the pair key
			// keeps a game listing "Aspyr (Mac)" and "Aspyr (Linux)" to one row
			for (const dev of item.basic_info?.developers ?? []) {
				const devId = dev.name ? devMap.get(companyNameKey(dev.name)) : undefined;
				if (devId !== undefined) {
					devPairsMap.set(`${appId}_${devId}`, [appId, devId]);
				}
			}

			for (const pub of item.basic_info?.publishers ?? []) {
				const pubId = pub.name ? pubMap.get(companyNameKey(pub.name)) : undefined;
				if (pubId !== undefined) {
					pubPairsMap.set(`${appId}_${pubId}`, [appId, pubId]);
				}
			}

			for (const tag of item.tags ?? []) {
				tagPairsMap.set(`${appId}_${tag.tagid}`, [
					appId,
					tag.tagid,
					tag.weight ?? null,
				]);
			}

			for (const categoryId of item.categories?.supported_player_categoryids ??
				[]) {
				categoryPairsMap.set(`${appId}_${categoryId}_supported_player`, [
					appId,
					categoryId,
					"supported_player",
				]);
			}
			for (const categoryId of item.categories?.feature_categoryids ?? []) {
				categoryPairsMap.set(`${appId}_${categoryId}_feature`, [
					appId,
					categoryId,
					"feature",
				]);
			}

			for (const lang of item.supported_languages ?? []) {
				languagePairsMap.set(`${appId}_${lang.elanguage}`, [
					appId,
					lang.elanguage,
					lang.eadditionallanguage ?? null,
					lang.supported ?? null,
					lang.full_audio ?? null,
					lang.subtitles ?? null,
				]);
			}
		}

		const devPairs = Array.from(devPairsMap.values());
		const pubPairs = Array.from(pubPairsMap.values());
		const tagPairs = Array.from(tagPairsMap.values());
		const categoryPairs = Array.from(categoryPairsMap.values());
		const languagePairs = Array.from(languagePairsMap.values());

		await bulkUpsert(
			"game_developers",
			["game_id", "developer_id"],
			devPairs,
			"ON CONFLICT DO NOTHING",
		);
		await bulkUpsert(
			"game_publishers",
			["game_id", "publisher_id"],
			pubPairs,
			"ON CONFLICT DO NOTHING",
		);
		await bulkUpsert(
			"game_tags",
			["game_id", "tag_id", "weight"],
			tagPairs,
			"ON CONFLICT (game_id, tag_id) DO UPDATE SET weight = EXCLUDED.weight",
		);
		await bulkUpsert(
			"game_categories",
			["game_id", "category_id", "category_type"],
			categoryPairs,
			"ON CONFLICT DO NOTHING",
		);
		// ~22 languages per game at 6 columns overflows the parameter limit
		await bulkUpsertUnnest(
			"game_supported_languages",
			[
				"game_id",
				"elanguage",
				"eadditionallanguage",
				"supported",
				"full_audio",
				"subtitles",
			],
			["int", "int", "int", "boolean", "boolean", "boolean"],
			languagePairs,
			"ON CONFLICT (game_id, elanguage) DO UPDATE SET eadditionallanguage = EXCLUDED.eadditionallanguage, supported = EXCLUDED.supported, full_audio = EXCLUDED.full_audio, subtitles = EXCLUDED.subtitles",
		);

		await cleanUpRelations(
			"game_developers",
			gameIds,
			["developer_id"],
			devPairs,
		);
		await cleanUpRelations(
			"game_publishers",
			gameIds,
			["publisher_id"],
			pubPairs,
		);
		await cleanUpRelations(
			"game_tags",
			gameIds,
			["tag_id"],
			tagPairs.map((t) => [t[0], t[1]]),
		);
		await cleanUpRelations(
			"game_categories",
			gameIds,
			["category_id", "category_type"],
			categoryPairs,
		);
		await cleanUpRelations(
			"game_supported_languages",
			gameIds,
			["elanguage"],
			languagePairs.map((l) => [l[0], l[1]]),
		);
	}
};

export const getGameCount = async () => {
	const result = await backgroundPool.query("SELECT COUNT(*) FROM games");
	return result.rows[0].count;
};

export const getOldestGame = async () => {
	const result = await backgroundPool.query(
		"SELECT * FROM games ORDER BY last_updated ASC LIMIT 1",
	);
	return result.rows[0];
};

export const getNewestGame = async () => {
	const result = await backgroundPool.query(
		"SELECT * FROM games JOIN game_assets on games.app_id = game_assets.game_id ORDER BY last_updated DESC, app_id DESC LIMIT 1",
	);
	return result.rows[0];
};

export const upsertTags = async (tags: { tagid: number; name: string }[]) => {
	if (tags.length === 0) return null;

	const values: any[] = [];
	const placeholders = tags
		.map((tag, i) => {
			values.push(tag.tagid, tag.name);
			return `($${i * 2 + 1}, $${i * 2 + 2})`;
		})
		.join(", ");

	const query = `
        INSERT INTO tags (id, name) 
        VALUES ${placeholders} 
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    `;

	const result = await backgroundPool.query(query, values);
	return result.rows[0];
};

export const upsertCategories = async (
	categories: {
		categoryid: number;
		type: number;
		name: string;
		image_path: string;
	}[],
) => {
	if (categories.length === 0) return null;

	const values: any[] = [];
	const placeholders = categories
		.map((category, i) => {
			values.push(
				category.categoryid,
				category.type,
				category.name,
				category.image_path,
			);
			return `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`;
		})
		.join(", ");

	const query = `
        INSERT INTO categories (id, type, name, image_path) 
        VALUES ${placeholders} 
        ON CONFLICT (id) DO UPDATE SET type = EXCLUDED.type, name = EXCLUDED.name, image_path = EXCLUDED.image_path
    `;

	const result = await backgroundPool.query(query, values);
	return result.rows[0];
};

type companyRow = {
	id: number;
	name: string;
	name_key: string | null;
	games: number;
};

type companyMergePlan = {
	loserIds: number[];
	// Parallel to loserIds
	survivorIds: number[];
	deleteIds: number[];
	updates: { id: number; name: string; key: string }[];
};

// Each key keeps the row with the most games, ties to the lowest id. Rows
// whose name has no key (" ", "...") are deleted along with their links.
const planCompanyMerge = (rows: companyRow[]): companyMergePlan => {
	const plan: companyMergePlan = {
		loserIds: [],
		survivorIds: [],
		deleteIds: [],
		updates: [],
	};
	const groups = new Map<string, companyRow[]>();

	for (const row of rows) {
		const key = companyNameKey(row.name);
		if (!key) {
			plan.deleteIds.push(row.id);
			continue;
		}
		groups.set(key, [...(groups.get(key) ?? []), row]);
	}

	for (const [key, group] of groups) {
		group.sort((a, b) => b.games - a.games || a.id - b.id);
		const [survivor, ...losers] = group;

		for (const loser of losers) {
			plan.loserIds.push(loser.id);
			plan.survivorIds.push(survivor.id);
			plan.deleteIds.push(loser.id);
		}

		const name = cleanCompanyName(survivor.name);
		if (name !== survivor.name || key !== survivor.name_key) {
			plan.updates.push({ id: survivor.id, name, key });
		}
	}

	return plan;
};

// Folds every spelling of a company into one row and fills name_key. Runs at
// boot, so rows from before name_key existed, or from older matching rules, are
// merged under the current rules. Reads only when there is nothing to change.
export const mergeDuplicateCompanies = async ({
	table,
	joinTable,
	fkColumn,
}: companyTable): Promise<companyMergeResult> => {
	const client = await backgroundPool.connect();

	try {
		await client.query("BEGIN");
		// Blocks another instance's sync from linking a row about to be deleted
		await client.query(
			`LOCK TABLE ${table}, ${joinTable} IN SHARE ROW EXCLUSIVE MODE;`,
		);

		const result = await client.query(
			`SELECT ${table}.id, ${table}.name, ${table}.name_key, COUNT(${joinTable}.game_id)::int AS games
			FROM ${table}
			LEFT JOIN ${joinTable} ON ${joinTable}.${fkColumn} = ${table}.id
			GROUP BY ${table}.id;`,
		);
		const plan = planCompanyMerge(result.rows as companyRow[]);

		if (plan.loserIds.length > 0) {
			await client.query(
				`INSERT INTO ${joinTable} (game_id, ${fkColumn})
				SELECT ${joinTable}.game_id, merge.survivor_id
				FROM ${joinTable}
				JOIN unnest($1::int[], $2::int[]) AS merge(loser_id, survivor_id)
					ON ${joinTable}.${fkColumn} = merge.loser_id
				ON CONFLICT DO NOTHING;`,
				[plan.loserIds, plan.survivorIds],
			);
		}

		// Cascades the deleted rows' links, and frees their names and keys
		// before the survivors take them
		if (plan.deleteIds.length > 0) {
			await client.query(`DELETE FROM ${table} WHERE id = ANY($1::int[]);`, [
				plan.deleteIds,
			]);
		}

		if (plan.updates.length > 0) {
			const ids = plan.updates.map((update) => update.id);
			// Unique checks run row by row, so two rows trading keys under
			// changed rules would collide without clearing them first
			await client.query(
				`UPDATE ${table} SET name_key = NULL WHERE id = ANY($1::int[]);`,
				[ids],
			);
			await client.query(
				`UPDATE ${table}
				SET name = renamed.name, name_key = renamed.name_key
				FROM unnest($1::int[], $2::text[], $3::text[]) AS renamed(id, name, name_key)
				WHERE ${table}.id = renamed.id;`,
				[
					ids,
					plan.updates.map((update) => update.name),
					plan.updates.map((update) => update.key),
				],
			);
		}

		await client.query("COMMIT");
		return { merged: plan.deleteIds.length, updated: plan.updates.length };
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};
