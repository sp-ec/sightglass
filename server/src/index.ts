import "dotenv/config";
import express from "express";
import cors from "cors";
import { initializeDatabase } from "./sql/db";
import apiRoutes from "./api.routes";

const app = express();
const port = process.env.PORT || 3001;
const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

app.use(
	cors({
		origin(origin, callback) {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
				return;
			}

			callback(new Error("Not allowed by CORS"));
		},
	}),
);
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

const startServer = async () => {
	// Ensure the database schema exists before accepting HTTP requests
	await initializeDatabase();

	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
};

startServer();
