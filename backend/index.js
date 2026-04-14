/**
 * index.js — Caissa Express backend entry point
 *
 * Validates environment variables, then starts the HTTP server.
 * All Express setup lives in app.js so tests can import it directly.
 *
 * Available routes:
 *   GET    /              — health check
 *   GET    /modules       — list all modules          (public)
 *   GET    /modules/:id   — get one module + lessons  (public)
 *   PUT    /modules/:id   — update a module           (admin)
 *   DELETE /modules/:id   — delete a module           (admin)
 *   GET    /lessons/:id   — get one lesson with content (requires auth + prereq)
 *   PUT    /lessons/:id   — update a lesson           (admin)
 *   DELETE /lessons/:id   — delete a lesson           (admin)
 *   GET    /puzzles/lesson/:lessonId — puzzles for a lesson (public)
 *   GET    /progress      — list user's completed lessons (requires auth)
 *   POST   /progress      — mark a lesson as complete    (requires auth)
 *   POST   /admin/modules — create a module              (admin)
 *   POST   /admin/lessons — create a lesson              (admin)
 */

require("dotenv").config();

// -------------------------------------------------------------------
// Startup environment variable validation
// Fail immediately if required secrets are missing so developers
// get a clear error instead of a confusing runtime failure later.
// -------------------------------------------------------------------

const REQUIRED_ENV_VARS = ["DATABASE_URL", "SUPABASE_JWT_SECRET"];

for (const varName of REQUIRED_ENV_VARS) {
  const value = process.env[varName];
  if (!value || value.startsWith("<")) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    console.error(`       Set it in backend/.env before starting the server.`);
    process.exit(1);
  }
}

// Import the database pool — connecting it here logs a confirmation on startup
require("./db");

const app  = require("./app");
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
