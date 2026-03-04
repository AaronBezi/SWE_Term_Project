/**
 * routes/modules.js — API routes for chess learning modules
 *
 * Modules are the top-level groupings of lessons.
 * Example: "Fundamentals" (module 1) → "Tactics" (module 2) → "Endgames" (module 3)
 *
 * These routes are PUBLIC — no login required.
 * Any visitor can see the list of modules and their lessons.
 *
 * Routes:
 *   GET /modules        — returns all modules in course order
 *   GET /modules/:id    — returns one module plus all of its lessons
 *
 * Mounted in index.js at: app.use("/modules", modulesRouter)
 */

const express = require("express");
const router  = express.Router();
const db      = require("../db");


// -------------------------------------------------------------------
// GET /modules
//
// Returns every module sorted by order_index so the frontend can
// display them in the correct course sequence.
//
// Response: array of module objects
//   [ { id, title, description, order_index, created_at }, ... ]
// -------------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, title, description, order_index, created_at
       FROM   modules
       ORDER  BY order_index ASC`
    );

    // result.rows is an array — one object per module row
    res.json(result.rows);

  } catch (err) {
    console.error("GET /modules error:", err.message);
    res.status(500).json({ error: "Failed to fetch modules" });
  }
});


// -------------------------------------------------------------------
// GET /modules/:id
//
// Returns a single module by its numeric ID, along with an array of
// all lessons belonging to that module sorted by lesson order.
//
// This is used when the frontend loads the detail page for a module
// and needs to show the list of lessons inside it.
//
// Response:
//   {
//     id, title, description, order_index, created_at,
//     lessons: [ { id, title, order_index, created_at }, ... ]
//   }
// -------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  // req.params.id is always a string, e.g. "2" — parse it to a number
  const moduleId = parseInt(req.params.id, 10);

  // Reject the request early if the ID is not a valid integer
  if (isNaN(moduleId)) {
    return res.status(400).json({ error: "Module ID must be a number" });
  }

  try {
    // Query 1: fetch the module itself
    const moduleResult = await db.query(
      `SELECT id, title, description, order_index, created_at
       FROM   modules
       WHERE  id = $1`,
      [moduleId]
    );

    // If no rows returned, there is no module with that ID
    if (moduleResult.rows.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }

    // Query 2: fetch all lessons that belong to this module
    // We do not include lesson content here to keep the response light —
    // full content is available via GET /lessons/:id
    const lessonsResult = await db.query(
      `SELECT id, title, order_index, created_at
       FROM   lessons
       WHERE  module_id = $1
       ORDER  BY order_index ASC`,
      [moduleId]
    );

    // Combine the module data with its lessons into one response object
    const response = {
      ...moduleResult.rows[0],       // spread module fields at the top level
      lessons: lessonsResult.rows,   // attach lessons array
    };

    res.json(response);

  } catch (err) {
    console.error(`GET /modules/${moduleId} error:`, err.message);
    res.status(500).json({ error: "Failed to fetch module" });
  }
});


module.exports = router;
