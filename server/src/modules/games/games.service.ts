import { findGameByTitle, findGameById } from "./games.repository";
import { gameAssets, gameBasicInfo, gameResponse } from "./games.types";

function formatAssetUrl(url: string, filename: string): string {
	let formattedUrl =
		"https://shared.akamai.steamstatic.com/store_item_assets/" + url;
	return formattedUrl.replace("${FILENAME}", filename);
}

function formatCommunityIconUrl(app_id: string, filename: string): string {
	let formattedUrl =
		"https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/" +
		app_id +
		"/" +
		filename +
		".jpg";
	return formattedUrl;
}

function formatBackgroundUrl(app_id: string): string {
	let formattedUrl =
		"https://cdn.cloudflare.steamstatic.com/steam/apps/" +
		app_id +
		"/page_bg_generated_v6b.jpg";
	return formattedUrl;
}

function formatLogoUrl(app_id: string): string {
	let formattedUrl =
		"https://cdn.cloudflare.steamstatic.com/steam/apps/" + app_id + "/logo.png";
	return formattedUrl;
}

export const searchGamesByTitle = async (query: string) => {
	if (!query || typeof query !== "string") {
		return [];
	}

	return await findGameByTitle(query);
};

export const fetchGameById = async (appId: string) => {
	if (!appId || typeof appId !== "string") {
		return null;
	}

	const gameData = await findGameById(appId);
	if (!gameData || !gameData.game) {
		return null;
	}

	const urlFormat = gameData.game.asset_url_format;
	let gameResponse: gameResponse = {
		game: {
			app_id: gameData.game.app_id,
			name: gameData.game.name,
			store_url: gameData.game.store_url_path,
			steam_release_date: gameData.game.steam_release_date,
			price_in_cents: gameData.game.price_in_cents,
			short_description: gameData.game.short_description,
			last_updated: gameData.game.last_updated,
			rating_type: gameData.game.rating_type,
			rating: gameData.game.rating,
		},
		assets: {
			main_capsule: formatAssetUrl(urlFormat, gameData.game.main_capsule),
			small_capsule: formatAssetUrl(urlFormat, gameData.game.small_capsule),
			header: formatAssetUrl(urlFormat, gameData.game.header),
			page_background: formatBackgroundUrl(gameData.game.app_id),
			hero_capsule: formatAssetUrl(urlFormat, gameData.game.hero_capsule),
			library_capsule: formatAssetUrl(urlFormat, gameData.game.library_capsule),
			library_hero: formatAssetUrl(urlFormat, gameData.game.library_hero),
			community_icon: formatCommunityIconUrl(
				gameData.game.app_id,
				gameData.game.community_icon,
			),
			logo: formatLogoUrl(gameData.game.app_id),
		},
		platforms: {
			windows: gameData?.game.windows,
			mac: gameData?.game.mac,
			steamos_linux: gameData?.game.steamos_linux,
			steam_deck_compat_category: gameData?.game.steam_deck_compat_category,
			steam_os_compat_category: gameData?.game.steam_os_compat_category,
		},
		reviews: {
			review_count: gameData?.game.review_count,
			percent_positive: gameData?.game.percent_positive,
			review_score: gameData?.game.review_score,
			review_score_label: gameData?.game.review_score_label,
		},
		tags: gameData?.tags,
		developers: gameData?.developers,
		publishers: gameData?.publishers,
		languages: gameData?.languages,
	};

	return gameResponse;
};
