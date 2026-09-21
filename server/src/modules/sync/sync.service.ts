import { fetchGamesQuery } from "./sync-queries";
import {
	saveSteamGames,
	getGameCount,
	getOldestGame,
	getNewestGame,
	upsertTags,
	upsertCategories,
} from "./sync.repository";

import { SteamQueryResponse, SyncOutcome } from "./sync.types";
import {
	ensureDefaultTagMultipliers,
	getSteamApiKey,
} from "@/modules/appSettings/appSettings.service";

const BATCH_SIZE = 1000;

let syncPromise: Promise<void> | null = null;
let syncStopRequested = false;

let totalFetched = 0;
let totalGames = 0;

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

	return response.json() as Promise<SteamQueryResponse>;
};

const runGameSync = async (startAt: number, apiKey: string) => {
	let start = startAt;

	while (!syncStopRequested) {
		const response = await fetchSteamGames(fetchGamesQuery(start, apiKey));
		const storeItems = response.response?.store_items ?? [];
		totalGames = response.response?.metadata?.total_matching_records ?? 0;

		if (storeItems.length === 0) {
			break;
		}

		totalFetched = start + storeItems.length;

		console.log(`Fetched games: ${start} ... ${storeItems.length + start}`);
		await saveSteamGames(storeItems);

		if (storeItems.length < BATCH_SIZE) {
			break;
		}

		start += BATCH_SIZE;
	}
};

export const startGameSync = async (startAt = 0): Promise<SyncOutcome> => {
	if (syncPromise) {
		return { status: "running", message: "Game sync already running" };
	}

	// The Steam API key lives only in the database. Without it Steam sees an
	// unauthenticated request and returns nothing, so fail here rather than
	// inside the detached promise where the rejection is only logged.
	const apiKey = await getSteamApiKey();
	if (!apiKey) {
		return {
			status: "misconfigured",
			message:
				"No Steam API key is configured. Add one under Administration > App Settings.",
		};
	}

	//sync tags/categories first
	await syncTags();
	await syncCategories();

	syncStopRequested = false;
	totalFetched = startAt;
	syncPromise = runGameSync(startAt, apiKey)
		.catch((error) => {
			console.error("Game sync failed:", error);
		})
		.finally(() => {
			syncPromise = null;
			syncStopRequested = false;
		});

	return { status: "started", message: "Game sync started" };
};

export const stopGameSync = async (): Promise<SyncOutcome> => {
	if (!syncPromise) {
		return { status: "idle", message: "Game sync not running" };
	}

	syncStopRequested = true;
	await syncPromise;

	return { status: "stopped", message: "Game sync stopped" };
};

export const getSyncStatus = async () => {
	const fetched = totalFetched != 0 ? totalFetched : await getGameCount();
	const total = totalGames != 0 ? totalGames : await getGameCount();
	const oldestGame = await getOldestGame();
	const newestGame = await getNewestGame();
	return {
		status: syncPromise ? "running" : "stopped",
		fetched: fetched,
		total: total,
		oldestGameDate: oldestGame?.last_updated,
		newestGame: newestGame,
	};
};

export const syncTags = async () => {
	const response = await fetch(
		"https://store.steampowered.com/tagdata/populartags/english",
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Steam Store tags request failed with status ${response.status}`,
		);
	}

	const data = await response.json();
	await upsertTags(data);

	// The default tag multipliers reference tags by name, so they can only be
	// seeded once the tags table has been populated
	await ensureDefaultTagMultipliers();

	return { message: "Game tags fetched and upserted" };
};

export const syncCategories = async () => {
	console.log("Fetching Steam Store categories...");
	const response = await fetch(
		"https://store.steampowered.com/actions/ajaxgetstorecategories",
		{
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Steam Store categories request failed with status ${response.status}`,
		);
	}

	const data = await response.json();
	await upsertCategories(data);

	return { message: "Game categories fetched and upserted" };
};
