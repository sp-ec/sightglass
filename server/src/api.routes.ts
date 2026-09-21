import express from 'express';
import syncRoutes from "./modules/sync/sync.routes";
import gameRoutes from "./modules/games/games.routes";
import authRoutes from "./modules/auth/auth.routes";
import appSettingsRoutes from "./modules/appSettings/appSettings.routes";
import { requireAdmin, requireAuth } from "./modules/auth/auth.middleware";

const apiRoutes = express.Router();

// Guards are mounted here rather than inside each module so the whole API's
// access policy is visible in one place, and a new module is visibly missing
// one rather than silently shipping unprotected
apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/sync", requireAuth, requireAdmin, syncRoutes);
apiRoutes.use("/games", requireAuth, gameRoutes);
apiRoutes.use("/app-settings", requireAuth, requireAdmin, appSettingsRoutes);

export default apiRoutes;
