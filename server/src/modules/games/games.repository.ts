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

export const findGameById = async (appId: string) => {
	try {
		const gameResult = await pool.query(
			`SELECT * FROM games
			JOIN game_assets ON games.app_id = game_assets.game_id
			JOIN game_platforms on games.app_id = game_platforms.game_id
			JOIN game_reviews_summary ON games.app_id = game_reviews_summary.game_id
       		WHERE app_id = $1;`,
			[appId],
		);
		const tagResult = await pool.query(
			`SELECT tags.name, game_tags.weight, tags.id FROM game_tags
			JOIN tags ON game_tags.tag_id = tags.id
       		WHERE game_id = $1
			ORDER BY game_tags.weight DESC;`,
			[appId],
		);
		const developerResult = await pool.query(
			`SELECT developers.name, developers.id FROM game_developers
			JOIN developers ON game_developers.developer_id = developers.id
       		WHERE game_id = $1;`,
			[appId],
		);
		const publisherResult = await pool.query(
			`SELECT publishers.name, publishers.id FROM game_publishers
			JOIN publishers ON game_publishers.publisher_id = publishers.id
       		WHERE game_id = $1;`,
			[appId],
		);
		const languageResult = await pool.query(
			`SELECT languages.code, languages.name, game_supported_languages.supported, game_supported_languages.full_audio, game_supported_languages.subtitles FROM game_supported_languages
			JOIN languages ON game_supported_languages.elanguage = languages.id
       		WHERE game_id = $1;`,
			[appId],
		);
		return {
			game: gameResult.rows[0],
			tags: tagResult.rows,
			developers: developerResult.rows,
			publishers: publisherResult.rows,
			languages: languageResult.rows,
		};
	} catch (error) {
		console.error(error);
		return [];
	}
};
