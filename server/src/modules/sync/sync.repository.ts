import pool from "@/sql/db";
import { bulkUpsert, unixToTimestamp, chunkArray } from "@/sql/dbUtils";

const CHUNK_SIZE = 500;

const cleanUpRelations = async (
	table: string,
	gameIds: number[],
	columns: string[],
	validTuples: any[][],
) => {
	if (gameIds.length === 0) return;
	if (validTuples.length === 0) {
		await pool.query(`DELETE FROM ${table} WHERE game_id = ANY($1::int[])`, [
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

	await pool.query(query, params);
};

export const saveSteamGames = async (storeItems: any[]) => {
	const chunks = chunkArray(storeItems, CHUNK_SIZE);

	for (const chunk of chunks) {
		const gamesMap = new Map<number, any[]>();
		const reviewsMap = new Map<number, any[]>();
		const assetsMap = new Map<number, any[]>();
		const platformsMap = new Map<number, any[]>();
		const uniqueDevs = new Set<string>();
		const uniquePubs = new Set<string>();

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
				if (dev.name) uniqueDevs.add(dev.name);
			}
			for (const pub of item.basic_info?.publishers ?? []) {
				if (pub.name) uniquePubs.add(pub.name);
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

		const devMap = new Map<string, number>();
		if (uniqueDevs.size > 0) {
			const devRows = await bulkUpsert(
				"developers",
				["name"],
				Array.from(uniqueDevs).map((name) => [name]),
				"ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name",
			);
			for (const row of devRows) devMap.set(row.name, row.id);
		}

		const pubMap = new Map<string, number>();
		if (uniquePubs.size > 0) {
			const pubRows = await bulkUpsert(
				"publishers",
				["name"],
				Array.from(uniquePubs).map((name) => [name]),
				"ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name",
			);
			for (const row of pubRows) pubMap.set(row.name, row.id);
		}

		const devPairsMap = new Map<string, any[]>();
		const pubPairsMap = new Map<string, any[]>();
		const tagPairsMap = new Map<string, any[]>();
		const categoryPairsMap = new Map<string, any[]>();
		const languagePairsMap = new Map<string, any[]>();

		for (const item of chunk) {
			const appId = item.appid ?? item.id;

			for (const dev of item.basic_info?.developers ?? []) {
				if (dev.name && devMap.has(dev.name)) {
					devPairsMap.set(`${appId}_${devMap.get(dev.name)}`, [
						appId,
						devMap.get(dev.name),
					]);
				}
			}

			for (const pub of item.basic_info?.publishers ?? []) {
				if (pub.name && pubMap.has(pub.name)) {
					pubPairsMap.set(`${appId}_${pubMap.get(pub.name)}`, [
						appId,
						pubMap.get(pub.name),
					]);
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
		await bulkUpsert(
			"game_supported_languages",
			[
				"game_id",
				"elanguage",
				"eadditionallanguage",
				"supported",
				"full_audio",
				"subtitles",
			],
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
