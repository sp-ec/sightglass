import express from 'express';
import syncRoutes from "./modules/sync/sync.routes";
import gameRoutes from "./modules/games/games.routes";

const apiRoutes = express.Router();

apiRoutes.use("/sync", syncRoutes);
apiRoutes.use("/games", gameRoutes);

export default apiRoutes;
