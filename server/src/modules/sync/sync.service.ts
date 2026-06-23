import { fetchGamesQuery } from "./sync-queries";
import { saveSteamGames } from "./sync.repository";
import { SteamQueryResponse } from "./sync.types";

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

const runGameSync = async (startAt: number) => {
    let start = startAt;

    while (!syncStopRequested) {
        const response = await fetchSteamGames(fetchGamesQuery(start));
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

export const startGameSync = async (startAt = 0) => {
    if (syncPromise) {
        return { message: "Game sync already running" };
    }

    syncStopRequested = false;
    totalFetched = startAt;
    syncPromise = runGameSync(startAt)
        .catch((error) => {
            console.error("Game sync failed:", error);
        })
        .finally(() => {
            syncPromise = null;
            syncStopRequested = false;
        });

    return { message: "Game sync started" };
};

export const stopGameSync = async () => {
    if (!syncPromise) {
        return { message: "Game sync not running" };
    }

    syncStopRequested = true;
    await syncPromise;

    return { message: "Game sync stopped" };
};

export const getSyncStatus = async () => {
    return { status: syncPromise ? "running" : "stopped", fetched: totalFetched, total: totalGames };
};
