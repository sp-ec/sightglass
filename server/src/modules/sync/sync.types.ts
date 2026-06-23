export type GameDetails = {
  app_id: number;
  name: string;
  developer: string;
  publisher: string;
  positive: number;
  negative: number;
  owners: string;
  price: number;
  ccu: number;
  tags: Record<string, number>;
  languages: string;
  genre: string;
};

export type SteamQueryResponse = {
    response?: {
        metadata?: {
            total_matching_records?: number;
        };
        store_items?: unknown[];
    };
};

export type SyncStatus = {
    status: "running" | "stopped";
    fetched: number;
    total: number;
}