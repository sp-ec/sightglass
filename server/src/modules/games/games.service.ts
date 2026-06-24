import { findGameByTitle } from "./games.repository";

export const searchGamesByTitle = async (query: string) => {
	if (!query || typeof query !== "string") {
		return [];
	}

	return await findGameByTitle(query);
};