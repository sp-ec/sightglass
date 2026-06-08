import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  database: 'steamanalyzer',
  port: 5432,
});

export const initializeDatabase = async (): Promise<void> => {
  const createGamesTableQuery = `
    CREATE TABLE IF NOT EXISTS games (
      app_id VARCHAR(255) PRIMARY KEY UNIQUE NOT NULL,
      name VARCHAR(255),
      last_updated TIMESTAMP,
      tags TEXT[],
      developer VARCHAR(255),
      publisher VARCHAR(255),
      rating_positive INT,
      rating_negative INT,
      price decimal(10, 2),
      ccu INT,
      owners_min INT,
      owners_max INT,
      languages TEXT[],
      genre VARCHAR(255)
    );
  `;
  const createTagsTableQuery = `
    CREATE TABLE IF NOT EXISTS tags (
      tag VARCHAR(255) PRIMARY KEY UNIQUE NOT NULL,
      last_updated TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;

  try {
    await pool.query(createGamesTableQuery);
    await pool.query(createTagsTableQuery);
    console.log('Database initialization complete: Tables verified.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};

export default pool;
