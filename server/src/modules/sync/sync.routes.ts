import express from 'express';
import {
	startSync,
	stopSync,
	getStatus,
	syncGameTags,
	putSyncSchedule,
} from "@/modules/sync/sync.controller";

const syncRoutes = express.Router();

syncRoutes.post("/start", startSync);
syncRoutes.post("/stop", stopSync);
syncRoutes.post("/tags", syncGameTags);
syncRoutes.get("/status", getStatus);
syncRoutes.put("/schedule", putSyncSchedule);

export default syncRoutes;
