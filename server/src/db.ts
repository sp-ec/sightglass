import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  database: 'steamanalyzer',
  port: 5432,
});

export default pool;
