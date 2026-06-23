import "dotenv/config";
import express from "express";
import { initializeDatabase } from "./sql/db";
import apiRoutes from "./api.routes";

const app = express();
const port = process.env.PORT || 3001;

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
