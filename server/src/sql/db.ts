import { Pool } from 'pg';
import fs from "fs/promises";
import path from "path";
import 'dotenv/config';

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  database: 'steamanalyzer',
  port: 5432,
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
