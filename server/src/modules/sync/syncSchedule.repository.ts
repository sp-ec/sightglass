import pool from "@/sql/db";
import { autoSyncSettings } from "./sync.types";

export const getAutoSyncSettings = async (): Promise<autoSyncSettings> => {
	const result = await pool.query(
		`SELECT auto_sync_interval_hours, auto_sync_next_at
		FROM app_settings WHERE id = 1;`,
	);

	const row = result.rows[0];
	return {
		intervalHours: (row?.auto_sync_interval_hours as number | null) ?? null,
		nextAt: (row?.auto_sync_next_at as Date | null) ?? null,
	};
};

export const updateAutoSync = async (
	intervalHours: number | null,
	nextAt: Date | null,
): Promise<void> => {
	await pool.query(
		`UPDATE app_settings
		SET auto_sync_interval_hours = $1, auto_sync_next_at = $2, updated_at = NOW()
		WHERE id = 1;`,
		[intervalHours, nextAt],
	);
};

export const updateAutoSyncNextAt = async (nextAt: Date): Promise<void> => {
	await pool.query(
		`UPDATE app_settings SET auto_sync_next_at = $1 WHERE id = 1;`,
		[nextAt],
	);
};
