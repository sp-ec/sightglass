import express from 'express';
import {
	getGameById,
	getGamesByTitle,
	getGamesList,
	getGameChartData,
	getTagOptions,
	getLanguageOptions,
} from "./games.controller";

const gameRoutes = express.Router();

// Every literal path stays above /:app_id, which would otherwise swallow it
gameRoutes.get("/list", getGamesList);
gameRoutes.get("/search", getGamesByTitle);
gameRoutes.get("/chart", getGameChartData);
gameRoutes.get("/tags", getTagOptions);
gameRoutes.get("/languages", getLanguageOptions);
gameRoutes.get("/:app_id", getGameById);

export default gameRoutes;
