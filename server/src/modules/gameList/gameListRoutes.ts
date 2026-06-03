import express from 'express';
import { syncInitialGameList } from './gameListController';

const gameListRoutes = express.Router();

gameListRoutes.post('/sync-initial', syncInitialGameList);
gameListRoutes.post('/sync-new', () => {});
gameListRoutes.post('/search', () => {});

export default gameListRoutes;
