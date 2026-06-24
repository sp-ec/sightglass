import express from 'express';
import { getGamesByTitle } from './games.controller';

const gameRoutes = express.Router();

gameRoutes.get("/", getGamesByTitle);

export default gameRoutes;
