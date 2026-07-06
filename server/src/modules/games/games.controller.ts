import { Request, Response } from "express";
import { fetchGameById, searchGamesByTitle, getChartAggregation } from "./games.service";

export const getGamesByTitle = async (req: Request, res: Response) => {
	try {
		const result = await searchGamesByTitle(req.query.title as string);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to search games",
		});
	}
};

export const getGameById = async (req: Request, res: Response) => {
	try {
		const result = await fetchGameById(req.params.app_id as string);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to get game by ID",
		});
	}
};

export const getGameChartData = async (req: Request, res: Response) => {
	try {
		const result = await getChartAggregation(
			req.query.mode as string,
			req.query.bucket_size as string | undefined,
			req.query.aggregate as "average" | "median" | undefined,
		);
		if (!result) {
			return res.status(400).json({
				message: "Invalid chart aggregation mode",
			});
		}

		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to get chart aggregation data",
		});
	}
};