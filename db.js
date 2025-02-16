const { Pool } = require('pg');
const db_config=require("./config/db.json");

// Create a new PostgreSQL connection pool
const pool = new Pool(db_config);

// Test the database connection
pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL Database'))
    .catch((err) => console.error('❌ Database connection error:', err));

module.exports = pool;
