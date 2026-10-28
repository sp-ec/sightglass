import { Request, Response } from "express";
import { fetchCompaniesList, fetchCompanyById } from "./companies.service";
import { companyConfig } from "./companies.types";

// Each kind's router mounts these at /list and /:id
export const companyControllers = (config: companyConfig) => {
	const title = config.label[0].toUpperCase() + config.label.slice(1);

	const getList = async (req: Request, res: Response) => {
		try {
			const result = await fetchCompaniesList(
				config,
				req.query.page as string | undefined,
				req.query.search as string | undefined,
				req.query.filters as string | undefined,
				req.query.sort as string | undefined,
				req.query.order as string | undefined,
			);
			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({
				message: `Failed to list ${config.label}s`,
			});
		}
	};

	const getById = async (req: Request, res: Response) => {
		try {
			const result = await fetchCompanyById(
				config,
				req.params.id as string | undefined,
			);
			if (!result) {
				return res.status(404).json({
					message: `${title} not found`,
				});
			}

			return res.status(200).json(result);
		} catch (error) {
			return res.status(500).json({
				message: `Failed to get ${config.label} by ID`,
			});
		}
	};

	return { getList, getById };
};
