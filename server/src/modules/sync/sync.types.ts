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

// Discriminated so the controller can answer 400 for a misconfigured app
// without the service throwing
export type SyncOutcome = {
    status:
        | "started"
        | "running"
        | "stopped"
        | "idle"
        | "misconfigured"
        | "limit_reached";
    message: string;
};

// A null interval means automatic sync is off
export type autoSyncSettings = {
    intervalHours: number | null;
    nextAt: Date | null;
};

export type autoSyncView = {
    intervalHours: number | null;
    nextSyncAt: string | null;
};

export type autoSyncOutcome =
    | { status: "ok"; autoSync: autoSyncView }
    | { status: "invalid"; message: string };

// Fixed pairs, so no caller-supplied name reaches the merge SQL
export type companyTable =
    | { table: "developers"; joinTable: "game_developers"; fkColumn: "developer_id" }
    | { table: "publishers"; joinTable: "game_publishers"; fkColumn: "publisher_id" };

export type companyMergeResult = {
    merged: number;
    updated: number;
};