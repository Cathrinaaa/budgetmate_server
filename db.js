import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

const {
  PROD_DB_HOST,
  PROD_DB_NAME,
  PROD_DB_USER,
  PROD_DB_PASSWORD,
  PROD_DB_PORT,
  PROD_ENDPOINT_ID
} = process.env;

const pool = new Pool({
  host: PROD_DB_HOST,
  user: PROD_DB_USER,
  password: PROD_DB_PASSWORD,
  database: PROD_DB_NAME,
  port: PROD_DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionString: `postgres://${PROD_DB_USER}:${PROD_DB_PASSWORD}@${PROD_DB_HOST}:${PROD_DB_PORT}/${PROD_DB_NAME}?options=project=${PROD_ENDPOINT_ID}`,
});

// Optional: test connection
pool.connect()
  .then(() => console.log('Connected to Neon PostgreSQL'))
  .catch(err => console.error('Database connection error:', err.stack));

export default pool;
