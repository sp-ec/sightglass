import express from 'express';
import gameListRoutes from './modules/sync/sync.routes';

const apiRoutes = express.Router();

apiRoutes.use("/sync", gameListRoutes);

export default apiRoutes;
