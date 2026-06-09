import { Request, Response } from 'express';
import { processTitleSync } from "@/modules/gameList/titles/gameListTitleService";
import { startDetailSync, stopDetailSync } from "@/modules/gameList/details/gameListDetailService";

const isActiveToggle = (req: Request) => req.query.active === "true";

export const syncGameListTitles = async (req: Request, res: Response) => {
	try {
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
		if (isActiveToggle(req)) {
			const result = await startDetailSync();
			return res.status(200).json(result);
		}

		const result = await stopDetailSync();
		return res.status(200).json(result);
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
			// startTagSync();
			return res.status(200).json({ message: "Tag sync started" });
		} else {
			// stopTagSync();
			return res.status(200).json({ message: "Tag sync stopped" });
		}
	} catch (error) {
		return res.status(500).json({
			message: "Failed to sync game list",
		});
	}
};
