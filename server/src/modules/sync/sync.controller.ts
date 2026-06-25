import { Request, Response } from "express";
import {
	startGameSync,
	stopGameSync,
	getSyncStatus,
	syncTags,
} from "@/modules/sync/sync.service";

export const startSync = async (req: Request, res: Response) => {
	try {
		const startAt = Number(req.body?.startAt ?? 0);
		const result = await startGameSync(Number.isFinite(startAt) ? startAt : 0);
		return res.status(200).json(result);
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
		const result = await getSyncStatus();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to get sync status",
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
