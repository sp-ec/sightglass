import express from 'express';
import { getGameById, getGamesByTitle } from "./games.controller";

const gameRoutes = express.Router();

gameRoutes.get("/search", getGamesByTitle);
gameRoutes.get("/:app_id", getGameById);

export default gameRoutes;
