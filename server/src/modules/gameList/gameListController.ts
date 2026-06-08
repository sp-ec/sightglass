import { Request, Response } from 'express';
import { processTitleSync } from "@/modules/gameList/titles/gameListTitleService";
import {
	startDetailSync,
	stopDetailSync,
} from "@/modules/gameList/details/gameListDetailService";

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
