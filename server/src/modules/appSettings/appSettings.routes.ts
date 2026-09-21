import express from "express";
import {
	getAppSettings,
	putAppSettings,
} from "@/modules/appSettings/appSettings.controller";

const appSettingsRoutes = express.Router();

appSettingsRoutes.get("/", getAppSettings);
appSettingsRoutes.put("/", putAppSettings);

export default appSettingsRoutes;
