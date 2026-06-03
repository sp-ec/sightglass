import "dotenv/config";
import express, { Request, Response } from 'express';
import gameListRoutes from "./modules/gameList/gameListRoutes";
import { initializeDatabase } from "./config/db";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.use("/gamelist", gameListRoutes);

const startServer = async () => {
	// Ensure the database schema exists before accepting HTTP requests
	await initializeDatabase();

	app.listen(port, () => {
		console.log(`Server running on port ${port}`);
	});
};

startServer();
