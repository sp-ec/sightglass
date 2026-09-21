import { Request, Response } from "express";
import {
	loadAppSettings,
	updateAppSettings,
} from "@/modules/appSettings/appSettings.service";

export const getAppSettings = async (req: Request, res: Response) => {
	try {
		const result = await loadAppSettings();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ message: "Failed to load app settings" });
	}
};

export const putAppSettings = async (req: Request, res: Response) => {
	try {
		const outcome = await updateAppSettings(req.body);
		if (outcome.status === "invalid") {
			return res.status(400).json({ message: outcome.message });
		}

		// The whole view comes back so the API tab's mask refreshes without a
		// second round trip
		return res.status(200).json(outcome.appSettings);
	} catch (error) {
		return res.status(500).json({ message: "Failed to update app settings" });
	}
};
