import axios from 'axios';
import pool from "@/sql/db";
import { type GameDetails } from '../gameListTypes';
import { upsertGameDetails } from '@/modules/gameList/details/gameListDetailRepository';

// How many games to fetch before upserting to the database
const CHUNK_SIZE = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const steamSpyUrl = 'https://steamspy.com/api.php?request=appdetails';

let isSyncing = false;

type GameRow = {
  app_id: string;
};

type SteamSpyResponse = {
  name?: string;
  developer?: string;
  publisher?: string;
  positive?: number;
  negative?: number;
  owners?: string;
  price?: number;
  ccu?: number;
  tags?: Record<string, number>;
  languages?: string;
  genre?: string;
};

const fetchGameDetails = async (appid?: number) => {
  const response = await axios.get<SteamSpyResponse>(steamSpyUrl, {
    params: {
      appid,
    },
  });

  return response.data;
};

const fetchAllGameDetails = async () => {
  const games = await pool.query<GameRow>('SELECT app_id FROM games ORDER BY last_updated DESC');
  const allDetails: GameDetails[] = [];

  for (const game of games.rows) {
    if (!isSyncing) {
      console.log('Detail sync stopped by user.');
      return;
    }

    const appId = Number(game.app_id);
    const details = await fetchGameDetails(appId);

    allDetails.push({
      app_id: appId,
      name: details.name ?? '',
      developer: details.developer ?? '',
      publisher: details.publisher ?? '',
      positive: details.positive ?? 0,
      negative: details.negative ?? 0,
      owners: details.owners ?? '0 .. 0',
      price: details.price ?? 0,
      ccu: details.ccu ?? 0,
      tags: details.tags ?? {},
      languages: details.languages ?? '[]',
      genre: details.genre ?? '',
    });

    console.log(`Fetched details for app_id: ${appId}`);

    if (allDetails.length >= CHUNK_SIZE) {
      await upsertGameDetails(allDetails.splice(0, CHUNK_SIZE));
    }

    // 1 second delay to avoid hitting API rate limits
    await delay(1000);
  }

  if (allDetails.length > 0) {
    await upsertGameDetails(allDetails);
  }

  console.log('Finished fetching all game details.');
};

export const startDetailSync = async () => {
  isSyncing = true;
  fetchAllGameDetails();
}

export const stopDetailSync = () => {
  isSyncing = false;
}
