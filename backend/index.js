/**
 * index.js — Caissa Express backend entry point
 *
 * Sets up the Express app with middleware and mounts all API route files.
 * Environment variables are loaded from .env via dotenv.
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

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();


// -------------------------------------------------------------------
// Startup environment variable validation
// Fail immediately if required secrets are missing so developers
// get a clear error instead of a confusing runtime failure later.
// -------------------------------------------------------------------

const REQUIRED_ENV_VARS = ["DATABASE_URL", "SUPABASE_JWT_SECRET"];

for (const varName of REQUIRED_ENV_VARS) {
  const value = process.env[varName];
  // Treat missing or un-filled placeholder values as invalid
  if (!value || value.startsWith("<")) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    console.error(`       Set it in backend/.env before starting the server.`);
    process.exit(1); // Stop the server — running without this would be insecure
  }
}


// Import the database pool — connecting it here logs a confirmation on startup
require("./db");

// Import route files
const modulesRouter  = require("./routes/modules");
const lessonsRouter  = require("./routes/lessons");
const puzzlesRouter  = require("./routes/puzzles");
const progressRouter = require("./routes/progress");
const adminRouter    = require("./routes/admin");

const app  = express();
const PORT = process.env.PORT || 3000;


// -------------------------------------------------------------------
// Security middleware
// -------------------------------------------------------------------

// helmet sets a collection of HTTP response headers that protect against
// common browser-based attacks (XSS, clickjacking, MIME sniffing, etc.).
// It should be the first middleware so headers are set on every response.
app.use(helmet());

// CORS — only allow requests from the known frontend origin.
// Any request from a different origin (e.g., a malicious site trying to
// call our API from a user's browser) will be blocked by the browser.
//
// CORS_ORIGIN can be set in .env for production (e.g., https://caissa.app).
// Falls back to the local Vite dev server if not set.
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin }));

// Rate limiting — caps how many requests a single IP address can make.
// This slows down brute-force attempts and protects against basic DoS.
// Limit: 100 requests per 15 minutes per IP address.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // maximum requests per window per IP
  standardHeaders: true,     // return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // disable the older X-RateLimit-* headers
  message: { error: "Too many requests — please try again later" },
});
app.use(limiter);

// Parse incoming JSON bodies.
// The "10kb" limit prevents attackers from sending huge payloads to exhaust memory.
app.use(express.json({ limit: "10kb" }));


// -------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------

// Health check — a quick way to confirm the server is up
app.get("/", (req, res) => {
  res.json({ message: "Caissa API is running" });
});

app.use("/modules",  modulesRouter);
app.use("/lessons",  lessonsRouter);
app.use("/puzzles",  puzzlesRouter);
app.use("/progress", progressRouter);
app.use("/admin",    adminRouter);

// 404 handler — catches any request that did not match a route above.
// Returns JSON instead of Express's default HTML error page, which could
// leak framework version information.
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});


// -------------------------------------------------------------------
// Start server
// -------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
