import { findGameByTitle, findGameById } from "./games.repository";

export const searchGamesByTitle = async (query: string) => {
	if (!query || typeof query !== "string") {
		return [];
	}

	return await findGameByTitle(query);
};

export const fetchGameById = async (appId: string) => {
	if (!appId || typeof appId !== "string") {
		return [];
	}

	return await findGameById(appId);
};
