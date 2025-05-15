import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

let pool;

if (process.env.NODE_ENV === 'development') {
  // Localhost PostgreSQL settings
  const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT } = process.env;

  pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
  });
} else {
  // Neon.tech PostgreSQL settings
  const {
    PROD_DB_HOST,
    PROD_DB_NAME,
    PROD_DB_USER,
    PROD_DB_PASSWORD,
    PROD_DB_PORT,
    PROD_ENDPOINT_ID
  } = process.env;

  pool = new Pool({
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
}

// Optional: test connection immediately
pool.connect()
  .then(() => console.log(`Connected to ${process.env.NODE_ENV} PostgreSQL`))
  .catch(err => console.error('Database connection error:', err.stack));

export default pool;
