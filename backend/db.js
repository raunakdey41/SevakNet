const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to PostgreSQL');
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DB] query executed in ${duration}ms — rows: ${res.rowCount}`);
    }
    return res;
  } catch (err) {
    console.error('[DB] Query error:', err.message);
    console.error('[DB] Query text:', text);
    throw err;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
