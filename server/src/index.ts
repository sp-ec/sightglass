import "dotenv/config";
import express from "express";
import { initializeDatabase } from "./sql/db";
import apiRoutes from "./api.routes";
import { requireAllowedOrigin } from "./modules/auth/auth.middleware";
import { purgeExpiredSessions } from "./modules/auth/auth.service";
import {
	backfillSteamApiKeyFromEnv,
	ensureDefaultTagMultipliers,
} from "./modules/appSettings/appSettings.service";

const app = express();
const port = process.env.PORT || 3001;

app.use(requireAllowedOrigin);
app.use(express.json());

// Hosting platforms terminate TLS at the edge, so trust their forwarded headers
app.set("trust proxy", 1);

// Routes
app.use("/api", apiRoutes);

const startServer = async () => {
	// Ensure the database schema exists before accepting HTTP requests
	await initializeDatabase();
	await purgeExpiredSessions();
	await backfillSteamApiKeyFromEnv();
	// Claims the seed as done as soon as tags exist, so that deleting every tag
	// multiplier is permanent rather than undone by the seed in tables.sql
	await ensureDefaultTagMultipliers();

	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
};

startServer();
