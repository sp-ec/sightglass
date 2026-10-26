import { Pool, PoolConfig } from 'pg';
import fs from "fs/promises";
import path from "path";
import 'dotenv/config';

// Managed Postgres providers terminate TLS with self-signed certificates
const ssl = process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined;

// Prefer a single connection string (Railway/Heroku style), fall back to discrete vars
const connection: PoolConfig = process.env.DATABASE_URL
	? { connectionString: process.env.DATABASE_URL, ssl }
	: {
			user: process.env.DB_USER ?? "postgres",
			password: process.env.DB_PASSWORD ?? "password",
			host: process.env.DB_HOST ?? "localhost",
			database: process.env.DB_NAME ?? "steamanalyzer",
			port: Number(process.env.DB_PORT ?? 5432),
		};

// Request traffic. Timeouts make a slow query or exhausted pool fail with a
// 500 instead of leaving the request hanging.
const pool = new Pool({
	...connection,
	max: 10,
	statement_timeout: 30_000,
	connectionTimeoutMillis: 10_000,
});

// Sync, estimate rebuilds and schema setup. Kept apart so long background work
// cannot take every connection from requests, and given a longer timeout.
export const backgroundPool = new Pool({
	...connection,
	max: 3,
	statement_timeout: 300_000,
});

export const initializeDatabase = async (): Promise<void> => {
	try {
		const sqlPath = path.resolve(__dirname, "tables.sql");
		const sql = await fs.readFile(sqlPath, "utf8");
		if (sql && sql.trim().length) {
			await backgroundPool.query(sql);
		}
		console.log("Database initialization complete: Tables verified.");
	} catch (error) {
		console.error("Database initialization failed:", error);
		process.exit(1);
	}
};

export default pool;
