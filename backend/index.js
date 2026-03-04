/**
 * index.js — Caissa Express backend entry point
 *
 * Sets up the Express app with middleware and mounts all API route files.
 * Environment variables are loaded from .env via dotenv.
 *
 * Available routes:
 *   GET  /              — health check
 *   GET  /modules       — list all modules          (public)
 *   GET  /modules/:id   — get one module + lessons  (public)
 */

const express = require("express");
const cors    = require("cors");
require("dotenv").config();

// Import the database pool — connecting it here logs a confirmation on startup
require("./db");

// Import route files
const modulesRouter = require("./routes/modules");

const app  = express();
const PORT = process.env.PORT || 3000;


// -------------------------------------------------------------------
// Global middleware
// -------------------------------------------------------------------

// Allow the frontend (localhost:5173) to make requests to this API
app.use(cors());

// Parse JSON bodies so req.body is available in route handlers
app.use(express.json());


// -------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------

// Health check — a quick way to confirm the server is up
app.get("/", (req, res) => {
  res.json({ message: "Caissa API is running" });
});

app.use("/modules", modulesRouter);


// -------------------------------------------------------------------
// Start server
// -------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
