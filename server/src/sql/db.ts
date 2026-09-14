import { Pool } from 'pg';
import fs from "fs/promises";
import path from "path";
import 'dotenv/config';

// Managed Postgres providers terminate TLS with self-signed certificates
const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

// Prefer a single connection string (Railway/Heroku style), fall back to discrete vars
const pool = process.env.DATABASE_URL
	? new Pool({ connectionString: process.env.DATABASE_URL, ssl })
	: new Pool({
			user: process.env.DB_USER ?? "postgres",
			password: process.env.DB_PASSWORD ?? "password",
			host: process.env.DB_HOST ?? "localhost",
			database: process.env.DB_NAME ?? "steamanalyzer",
			port: Number(process.env.DB_PORT ?? 5432),
		});

export const initializeDatabase = async (): Promise<void> => {
	try {
		const sqlPath = path.resolve(__dirname, "tables.sql");
		const sql = await fs.readFile(sqlPath, "utf8");
		if (sql && sql.trim().length) {
			await pool.query(sql);
		}
		console.log("Database initialization complete: Tables verified.");
	} catch (error) {
		console.error("Database initialization failed:", error);
		process.exit(1);
	}
};

export default pool;
