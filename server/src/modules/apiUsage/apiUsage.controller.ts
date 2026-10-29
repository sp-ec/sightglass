import { Request, Response } from "express";
import { getApiUsage } from "@/modules/apiUsage/apiUsage.service";

export const getUsage = async (req: Request, res: Response) => {
	try {
		const result = await getApiUsage();
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ message: "Failed to load API usage" });
	}
};
