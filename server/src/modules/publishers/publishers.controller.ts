import { Request, Response } from "express";
import { fetchPublisherById, fetchPublishersList } from "./publishers.service";

export const getPublishersList = async (req: Request, res: Response) => {
	try {
		const result = await fetchPublishersList(
			req.query.page as string | undefined,
			req.query.search as string | undefined,
			req.query.filters as string | undefined,
			req.query.sort as string | undefined,
			req.query.order as string | undefined,
		);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to list publishers",
		});
	}
};

export const getPublisherById = async (req: Request, res: Response) => {
	try {
		const result = await fetchPublisherById(
			req.params.publisher_id as string | undefined,
		);
		if (!result) {
			return res.status(404).json({
				message: "Publisher not found",
			});
		}

		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			message: "Failed to get publisher by ID",
		});
	}
};
