import { Request, Response } from 'express';
import { processTitleSync } from "@/modules/gameList/titles/gameListTitleService";
import {
	startDetailSync,
	stopDetailSync,
} from "@/modules/gameList/details/gameListDetailService";
import { startTagSync, stopTagSync } from '@/modules/gameList/tags/gameListTagService';

export const syncGameListTitles = async (req: Request, res: Response) => {
	try {
		console.log("Starting game list title sync...");
		const result = await processTitleSync();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to sync game list",
		});
	}
};

export const syncGameListDetails = async (req: Request, res: Response) => {
	try {
		const active = req.query.active === "true";
		if (active) {
			console.log("Starting game list detail sync...");
			startDetailSync();
			return res.status(200).json({ message: "Detail sync started" });
		} else {
			console.log("Stopping game list detail sync...");
			stopDetailSync();
			return res.status(200).json({ message: "Detail sync stopped" });
		}
	} catch (error) {
		return res.status(500).json({
			message: "Failed to sync game list",
		});
	}
};

export const syncGameListTags = async (req: Request, res: Response) => {
	try {
		const active = req.query.active === "true";
		if (active) {
			console.log("Starting game list tag sync...");
			startTagSync();
			return res.status(200).json({ message: "Tag sync started" });
		} else {
			console.log("Stopping game list tag sync...");
			stopTagSync();
			return res.status(200).json({ message: "Tag sync stopped" });
		}
	} catch (error) {
		return res.status(500).json({
			message: "Failed to sync game list",
		});
	}
};
