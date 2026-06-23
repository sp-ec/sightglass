import express from 'express';
import {
    startSync,
    stopSync,
    getStatus
} from "@/modules/sync/sync.controller";

const syncRoutes = express.Router();

syncRoutes.post("/start", startSync);
syncRoutes.post("/stop", stopSync);
syncRoutes.get("/status", getStatus);

export default syncRoutes;
