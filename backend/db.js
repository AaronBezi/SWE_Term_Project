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
 *   postgresql://postgres:<password>@127.0.0.1:5432/caissa
 *
 * Special characters in passwords:
 *   If your PostgreSQL password contains characters that are special in URLs
 *   (such as ? # @ ! :), you must percent-encode them in DATABASE_URL.
 *   Common encodings:  ! → %21   ? → %3F   # → %23   @ → %40
 *
 *   Why we parse manually:
 *   pg's built-in URL parser does not always decode percent-encoded
 *   passwords before sending them to PostgreSQL, causing auth failures.
 *   We use Node's URL class to split the connection string into parts,
 *   then call decodeURIComponent() on each part before passing them to
 *   pg.Pool — this reliably handles any percent-encoded special characters.
 */

const { Pool } = require("pg");

// Parse DATABASE_URL with Node's URL class so that percent-encoded special
// characters in the password are correctly decoded before reaching pg.
// Example: decodeURIComponent("chess%21pass%3F") returns "chess!pass?"
const dbUrl = new URL(process.env.DATABASE_URL);

const pool = new Pool({
  user:     decodeURIComponent(dbUrl.username),
  // decodeURIComponent is required here — for non-standard URL schemes like
  // "postgresql://", Node's URL class does NOT auto-decode percent-encoded
  // characters. Without this, %21 stays as %21 instead of becoming !
  password: decodeURIComponent(dbUrl.password),
  host:     dbUrl.hostname,
  port:     parseInt(dbUrl.port, 10),
  database: dbUrl.pathname.slice(1),  // pathname is "/caissa" — remove the leading /
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
