import { fetchGamesQuery } from "./fetchDetailQueries";
import { saveSteamGames } from "./gameListDetailRepository";

const BATCH_SIZE = 1000;

let detailSyncPromise: Promise<void> | null = null;
let detailSyncStopRequested = false;

const fetchSteamGames = async (query: ReturnType<typeof fetchGamesQuery>) => {
	const response = await fetch(
		"https://api.steampowered.com/IStoreQueryService/Query/v1/?input_json=" +
			encodeURIComponent(JSON.stringify(query)),
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(`Steam API request failed with status ${response.status}`);
	}

	return response.json() as Promise<{
		response?: {
			store_items?: unknown[];
		};
	}>;
};

const runDetailSync = async () => {
	let start = 0;

	while (!detailSyncStopRequested) {
		const response = await fetchSteamGames(fetchGamesQuery(start));
		const storeItems = response.response?.store_items ?? [];

		if (storeItems.length === 0) {
			break;
		}

		console.log(`Fetched games: ${start} ... ${storeItems.length + start}`);
		await saveSteamGames(storeItems);

		if (storeItems.length < BATCH_SIZE) {
			break;
		}

		start += BATCH_SIZE;
	}
};

export const startDetailSync = async () => {
	if (detailSyncPromise) {
		return { message: "Detail sync already running" };
	}

	detailSyncStopRequested = false;
	detailSyncPromise = runDetailSync()
		.catch((error) => {
			console.error("Detail sync failed:", error);
		})
		.finally(() => {
			detailSyncPromise = null;
			detailSyncStopRequested = false;
		});

	return { message: "Detail sync started" };
};

export const stopDetailSync = async () => {
	if (!detailSyncPromise) {
		return { message: "Detail sync not running" };
	}

	detailSyncStopRequested = true;
	await detailSyncPromise;

	return { message: "Detail sync stopped" };
};
