import { Request, Response } from "express";
import {
	startGameSync,
	stopGameSync,
	getSyncStatus,
	syncTags,
} from "@/modules/sync/sync.service";
import {
	getAutoSyncView,
	setAutoSyncInterval,
} from "@/modules/sync/syncSchedule.service";
import { SyncOutcome } from "@/modules/sync/sync.types";

// A missing API key is a configuration problem, not a started sync
const startStatusCode = (result: SyncOutcome): number => {
	if (result.status === "misconfigured") return 400;
	if (result.status === "limit_reached") return 429;
	return 200;
};

export const startSync = async (req: Request, res: Response) => {
	try {
		const startAt = Number(req.body?.startAt ?? 0);
		const result = await startGameSync(Number.isFinite(startAt) ? startAt : 0);
		return res.status(startStatusCode(result)).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to start sync",
		});
	}
};

export const stopSync = async (req: Request, res: Response) => {
	try {
		const result = await stopGameSync();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to stop sync",
		});
	}
};

export const getStatus = async (req: Request, res: Response) => {
	try {
		const [result, autoSync] = await Promise.all([
			getSyncStatus(),
			getAutoSyncView(),
		]);
		return res.status(200).json({ ...result, autoSync });
	} catch (error) {
		return res.status(500).json({
			message: "Failed to get sync status",
		});
	}
};

export const putSyncSchedule = async (req: Request, res: Response) => {
	try {
		const outcome = await setAutoSyncInterval(req.body);
		if (outcome.status === "invalid") {
			return res.status(400).json({ message: outcome.message });
		}
		return res.status(200).json(outcome.autoSync);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to update sync schedule",
		});
	}
};

export const syncGameTags = async (req: Request, res: Response) => {
	try {
		const result = await syncTags();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to sync game tags",
		});
	}
};
