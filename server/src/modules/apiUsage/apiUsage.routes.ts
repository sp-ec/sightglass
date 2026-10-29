import express from "express";
import { getUsage } from "@/modules/apiUsage/apiUsage.controller";

const apiUsageRoutes = express.Router();

apiUsageRoutes.get("/", getUsage);

export default apiUsageRoutes;
