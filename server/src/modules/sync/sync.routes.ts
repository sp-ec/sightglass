import express from 'express';
import {
	startSync,
	stopSync,
	getStatus,
	syncGameTags,
} from "@/modules/sync/sync.controller";

const syncRoutes = express.Router();

syncRoutes.post("/start", startSync);
syncRoutes.post("/stop", stopSync);
syncRoutes.post("/tags", syncGameTags);
syncRoutes.get("/status", getStatus);

export default syncRoutes;
