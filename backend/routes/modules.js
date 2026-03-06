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
 *   GET    /modules        — returns all modules in course order
 *   GET    /modules/:id    — returns one module plus all of its lessons
 *   PUT    /modules/:id    — update a module's title, description, or order (admin)
 *   DELETE /modules/:id    — delete a module and all its lessons (admin)
 *
 * Mounted in index.js at: app.use("/modules", modulesRouter)
 */

const express           = require("express");
const router            = express.Router();
const db                = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");


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


// -------------------------------------------------------------------
// PUT /modules/:id
//
// Updates a module's title, description, and/or order_index.
// Requires admin role. Only fields present in the request body are
// updated — omitted fields keep their current values.
//
// Request body (all fields optional, at least one required):
//   { "title": "New Title", "description": "...", "order_index": 2 }
//
// Response: updated module object
//   { id, title, description, order_index, created_at }
// -------------------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const moduleId = parseInt(req.params.id, 10);
  if (isNaN(moduleId)) {
    return res.status(400).json({ error: "Module ID must be a number" });
  }

  const { title, description, order_index } = req.body;

  if (title === undefined && description === undefined && order_index === undefined) {
    return res.status(400).json({ error: "Provide at least one field to update: title, description, order_index" });
  }

  if (order_index !== undefined && (!Number.isInteger(order_index) || order_index < 1)) {
    return res.status(400).json({ error: "order_index must be a positive integer" });
  }

  try {
    const result = await db.query(
      `UPDATE modules
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           order_index = COALESCE($3, order_index)
       WHERE id = $4
       RETURNING id, title, description, order_index, created_at`,
      [title ?? null, description ?? null, order_index ?? null, moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A module with that order_index already exists" });
    }
    console.error(`PUT /modules/${moduleId} error:`, err.message);
    res.status(500).json({ error: "Failed to update module" });
  }
});


// -------------------------------------------------------------------
// DELETE /modules/:id
//
// Deletes a module and all of its lessons (CASCADE).
// Requires admin role.
//
// Response 200: { message: "Module deleted" }
// Response 404: module not found
// -------------------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const moduleId = parseInt(req.params.id, 10);
  if (isNaN(moduleId)) {
    return res.status(400).json({ error: "Module ID must be a number" });
  }

  try {
    const result = await db.query(
      `DELETE FROM modules WHERE id = $1 RETURNING id`,
      [moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }

    res.json({ message: "Module deleted" });

  } catch (err) {
    console.error(`DELETE /modules/${moduleId} error:`, err.message);
    res.status(500).json({ error: "Failed to delete module" });
  }
});


module.exports = router;
