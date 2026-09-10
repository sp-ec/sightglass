import express from 'express';
import {
	getGameById,
	getGamesByTitle,
	getGameChartData,
	getTagOptions,
	getLanguageOptions,
} from "./games.controller";

const gameRoutes = express.Router();

gameRoutes.get("/search", getGamesByTitle);
gameRoutes.get("/chart", getGameChartData);
gameRoutes.get("/tags", getTagOptions);
gameRoutes.get("/languages", getLanguageOptions);
gameRoutes.get("/:app_id", getGameById);

export default gameRoutes;
