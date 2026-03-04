/**
 * db.js — PostgreSQL connection pool
 *
 * Creates a shared pool of database connections using the `pg` library.
 * A pool keeps multiple connections open so that concurrent requests do
 * not have to wait for one connection to finish before the next can start.
 *
 * All route files import this pool and call pool.query() to run SQL.
 *
 * The connection string is read from DATABASE_URL in .env:
 *   postgresql://postgres:<password>@localhost:5432/caissa
 */

const { Pool } = require("pg");

// Create the pool using the connection string from the environment.
// pg reads DATABASE_URL automatically when connectionString is set.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection immediately on startup.
// If the database is unreachable (wrong password, not running, etc.)
// we want to know right away rather than on the first API request.
pool.connect((err, client, release) => {
  if (err) {
    console.error("Failed to connect to PostgreSQL:", err.message);
    return;
  }
  console.log("Connected to PostgreSQL database");
  release(); // Return the test client back to the pool
});

module.exports = pool;
