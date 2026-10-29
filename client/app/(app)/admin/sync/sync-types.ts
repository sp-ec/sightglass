// A null interval means automatic sync is off
export type autoSyncView = {
	intervalHours: number | null;
	nextSyncAt: string | null;
};

export const MIN_INTERVAL_HOURS = 1;
export const MAX_INTERVAL_HOURS = 8760;
