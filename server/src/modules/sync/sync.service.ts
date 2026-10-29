import { fetchGamesQuery } from "./sync-queries";
import {
	saveSteamGames,
	getGameCount,
	getOldestGame,
	getNewestGame,
	upsertTags,
	upsertCategories,
	mergeDuplicateCompanies,
} from "./sync.repository";

import { companyTable, SteamQueryResponse, SyncOutcome } from "./sync.types";
import {
	ensureDefaultTagMultipliers,
	getSteamApiKey,
	refreshGameEstimates,
} from "@/modules/appSettings/appSettings.service";
import {
	getApiUsage,
	isApiLimitReached,
	reserveSteamApiRequest,
} from "@/modules/apiUsage/apiUsage.service";
import { ApiLimitReachedError } from "@/modules/apiUsage/apiUsage.types";

const BATCH_SIZE = 1000;
const LIMIT_REACHED_MESSAGE =
	"The daily Steam API limit has been reached. Sync can resume after the limit resets.";

let syncPromise: Promise<void> | null = null;
let syncStopRequested = false;
let lastSyncError: string | null = null;

let totalFetched = 0;
let totalGames = 0;

const fetchSteamGames = async (query: ReturnType<typeof fetchGamesQuery>) => {
	// Throws once the daily limit is hit, which ends runGameSync's loop
	await reserveSteamApiRequest();

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

	if (await isApiLimitReached()) {
		return { status: "limit_reached", message: LIMIT_REACHED_MESSAGE };
	}

	//sync tags/categories first
	await syncTags();
	await syncCategories();

	syncStopRequested = false;
	lastSyncError = null;
	totalFetched = startAt;
	syncPromise = runGameSync(startAt, apiKey)
		.catch((error) => {
			if (error instanceof ApiLimitReachedError) {
				lastSyncError = LIMIT_REACHED_MESSAGE;
				return;
			}
			lastSyncError = "The last sync failed. Check the server logs for details.";
			console.error("Game sync failed:", error);
		})
		// Also after a stop or failure: every batch saved so far changed reviews
		// and prices. Inside syncPromise so status reads "running" until the
		// estimates are current.
		.then(refreshGameEstimates)
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
		lastError: lastSyncError,
		apiUsage: await getApiUsage(),
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

const COMPANY_TABLES: companyTable[] = [
	{ table: "developers", joinTable: "game_developers", fkColumn: "developer_id" },
	{ table: "publishers", joinTable: "game_publishers", fkColumn: "publisher_id" },
];

// Must finish before any sync: the sync matches companies on name_key, and a
// row still missing its key would collide with the incoming row on name instead
export const mergeDuplicateCompanyNames = async (): Promise<void> => {
	for (const companies of COMPANY_TABLES) {
		const { merged } = await mergeDuplicateCompanies(companies);
		if (merged > 0) {
			console.log(`Merged ${merged} duplicate ${companies.table}.`);
		}
	}
};
