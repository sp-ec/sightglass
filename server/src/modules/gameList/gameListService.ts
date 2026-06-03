import axios from 'axios';
import { upsertGames, type GameRecord } from './gameListRepository';

const steamAppListUrl = 'https://api.steampowered.com/IStoreService/GetAppList/v1';
const maxResults = 50000;

type SteamApp = {
  appid: number;
  name: string;
  last_modified: number;
};

type SteamAppListResponse = {
  response: {
    apps: SteamApp[];
    have_more_results?: boolean;
    last_appid?: number;
  };
};

const fetchGamesFromApi = async (lastAppId?: number) => {
  const response = await axios.get<SteamAppListResponse>(steamAppListUrl, {
    params: {
      key: process.env.STEAM_API_KEY,
      max_results: maxResults,
      last_appid: lastAppId,
    },
  });

  return response.data.response;
};

const fetchAllGamesFromApi = async () => {
  const games: SteamApp[] = [];
  let lastAppId: number | undefined = undefined;
  let hasMoreResults = true;

  while (hasMoreResults) {
    const response = await fetchGamesFromApi(lastAppId);
    const apps = response.apps ?? [];
    
    hasMoreResults = response.have_more_results ?? false;
    lastAppId = apps[apps.length - 1]?.appid;

    games.push(...apps);
    console.log(`Fetched ${apps.length} games from API (last_appid: ${lastAppId})`);
  }

  console.log(`Fetched ${games.length} games from API. No more results available.`);

  return games;
};

export const processInitialSync = async () => {
  const steamApps = await fetchAllGamesFromApi();
  const games: GameRecord[] = steamApps.map((app) => ({
    app_id: app.appid,
    name: app.name,
    last_modified: app.last_modified,
  }));

  const result = await upsertGames(games);

  return {
    fetchedCount: steamApps.length,
    processedCount: result.processedCount,
  };
};
