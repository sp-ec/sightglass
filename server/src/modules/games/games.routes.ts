import express from 'express';
import { getGameById, getGamesByTitle, getGameChartData } from "./games.controller";

const gameRoutes = express.Router();

gameRoutes.get("/search", getGamesByTitle);
gameRoutes.get("/chart", getGameChartData);
gameRoutes.get("/:app_id", getGameById);

export default gameRoutes;
