import { Request, Response } from "express";
import {
	startGameSync,
	stopGameSync,
	getSyncStatus,
} from "@/modules/sync/sync.service";

export const startSync = async (req: Request, res: Response) => {
	try {
		const result = await startGameSync();
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
			message: "Failed to start sync",
		});
	}
};
