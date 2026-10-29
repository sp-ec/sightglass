import { startGameSync } from "@/modules/sync/sync.service";
import {
	getAutoSyncSettings,
	updateAutoSync,
	updateAutoSyncNextAt,
} from "@/modules/sync/syncSchedule.repository";
import { autoSyncOutcome, autoSyncView } from "@/modules/sync/sync.types";
import { validationResult } from "@/modules/auth/auth.types";

const MIN_INTERVAL_HOURS = 1;
const MAX_INTERVAL_HOURS = 8760;
const HOUR_MS = 3_600_000;
// setTimeout overflows above this, so longer waits are armed in chunks
const MAX_TIMEOUT_MS = 2_147_483_647;

let timer: NodeJS.Timeout | null = null;

const clearTimer = () => {
	if (timer) {
		clearTimeout(timer);
		timer = null;
	}
};

const armTimer = async (): Promise<void> => {
	clearTimer();

	const { intervalHours, nextAt } = await getAutoSyncSettings();
	if (intervalHours === null || nextAt === null) {
		return;
	}

	const delay = Math.min(
		Math.max(nextAt.getTime() - Date.now(), 0),
		MAX_TIMEOUT_MS,
	);
	timer = setTimeout(() => void onTimer(), delay);
};

// Settings are re-read on fire, so a chunked wait or a change made since
// arming is honoured. nextAt moves on before the sync starts, so a skipped or
// failed run still waits a full interval rather than retrying in a loop.
const onTimer = async (): Promise<void> => {
	try {
		const { intervalHours, nextAt } = await getAutoSyncSettings();
		if (intervalHours === null || nextAt === null) {
			return;
		}

		if (Date.now() >= nextAt.getTime()) {
			await updateAutoSyncNextAt(new Date(Date.now() + intervalHours * HOUR_MS));
			const outcome = await startGameSync(0);
			if (outcome.status !== "started") {
				console.warn(`Scheduled sync skipped: ${outcome.message}`);
			}
		}
	} catch (error) {
		console.error("Scheduled sync failed:", error);
	}

	try {
		await armTimer();
	} catch (error) {
		console.error("Failed to schedule the next sync:", error);
	}
};

const validateInterval = (value: unknown): validationResult<number | null> => {
	if (value === null) {
		return { ok: true, value: null };
	}

	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < MIN_INTERVAL_HOURS ||
		value > MAX_INTERVAL_HOURS
	) {
		return {
			ok: false,
			message: `Interval must be a whole number of hours between ${MIN_INTERVAL_HOURS} and ${MAX_INTERVAL_HOURS}`,
		};
	}

	return { ok: true, value };
};

export const getAutoSyncView = async (): Promise<autoSyncView> => {
	const { intervalHours, nextAt } = await getAutoSyncSettings();
	return {
		intervalHours,
		nextSyncAt: intervalHours !== null && nextAt ? nextAt.toISOString() : null,
	};
};

// Saving any interval restarts the countdown from full
export const setAutoSyncInterval = async (
	body: unknown,
): Promise<autoSyncOutcome> => {
	const intervalHours =
		typeof body === "object" && body !== null && "intervalHours" in body
			? body.intervalHours
			: undefined;

	const validated = validateInterval(intervalHours);
	if (!validated.ok) {
		return { status: "invalid", message: validated.message };
	}

	const hours = validated.value;
	const nextAt = hours === null ? null : new Date(Date.now() + hours * HOUR_MS);
	await updateAutoSync(hours, nextAt);
	await armTimer();

	return { status: "ok", autoSync: await getAutoSyncView() };
};

// Called once at boot. A nextAt that passed while the server was down fires
// straight away.
export const startSyncScheduler = async (): Promise<void> => {
	await armTimer();
};
