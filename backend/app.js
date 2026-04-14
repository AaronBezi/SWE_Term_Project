/**
 * app.js — Express application setup (no server start)
 *
 * Exported so tests can import the app directly via supertest
 * without triggering the port listen or env-var validation.
 */

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");

const modulesRouter  = require("./routes/modules");
const lessonsRouter  = require("./routes/lessons");
const puzzlesRouter  = require("./routes/puzzles");
const progressRouter = require("./routes/progress");
const adminRouter    = require("./routes/admin");

const app = express();

app.use(helmet());

const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
app.use(cors({ origin: allowedOrigin }));

// Disable rate limiting in tests to avoid flaky 429 responses
if (process.env.NODE_ENV !== "test") {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests — please try again later" },
  });
  app.use(limiter);
}

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({ message: "Caissa API is running" });
});

app.use("/modules",  modulesRouter);
app.use("/lessons",  lessonsRouter);
app.use("/puzzles",  puzzlesRouter);
app.use("/progress", progressRouter);
app.use("/admin",    adminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
