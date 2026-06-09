import axios from 'axios';
import pool from "@/sql/db";
import * as cheerio from 'cheerio';
import { getTags, upsertGamesByTag, upsertTags } from './gameListTagRepository';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const steamSpyTagUrl = 'https://steamspy.com/api.php?request=tag';
const ONE_MONTH_MS = 1000 * 60 * 60 * 24 * 30;

let isSyncing = false;

// Get the list of tags by scraping the Steam tag browse page
export async function scrapeSteamTags(): Promise<string[]> {
  const url = 'https://store.steampowered.com/tag/browse/';
  const tags: string[] = [];

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    $('.tag_browse_tag').each((index, element) => {
      const tag = $(element).text().trim();
      if (tag) {
        tags.push(tag);
      }
    });

    console.log(`Scraped ${tags.length} tags from Steam`);
    return tags;
  } catch (error) {
    console.error('Error fetching Steam tags:', error);
    return [];
  }
}

// Check if tags need to be refreshed (if none exist or if last update was over a month ago), return existing/new tags.
const refreshTagsIfNeeded = async () => {
  const existingTags = await getTags();
  const latestUpdated = existingTags.reduce<Date | null>((latest, row) => {
    if (!latest || row.last_updated > latest) {
      return row.last_updated;
    }

    return latest;
  }, null);

  if (existingTags.length === 0 || !latestUpdated || Date.now() - latestUpdated.getTime() > ONE_MONTH_MS) {
    const scrapedTags = await scrapeSteamTags();
    await upsertTags(scrapedTags);
    return scrapedTags;
  }

  return existingTags.map((row) => row.tag);
};

type SteamSpyTagResponse = Record<string, Record<string, number>>;

// Fetch games by tag from SteamSpy and return
const fetchGamesByTag = async (tag: string) => {
  const response = await axios.get<SteamSpyTagResponse>(steamSpyTagUrl, {
    params: {
      tag,
    },
  });

  return response.data;
};

// Fetch all tags, then fetch and upsert games for each tag
const fetchAllTagDetails = async () => {
  const tags = await refreshTagsIfNeeded();

  for (const tag of tags) {
    if (!isSyncing) {
      console.log('Tag sync stopped by user.');
      return;
    }

    const tagDetails = await fetchGamesByTag(tag);
    await upsertGamesByTag(tag, tagDetails);
    await delay(1000);
  }

  console.log('Finished fetching all tag details.');
};

export const startTagSync = async () => {
  isSyncing = true;
  fetchAllTagDetails();
};

export const stopTagSync = () => {
  isSyncing = false;
};
