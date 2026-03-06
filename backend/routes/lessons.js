/**
 * routes/lessons.js — API routes for individual chess lessons
 *
 * A lesson belongs to a module and contains the actual learning content
 * the user reads/watches. Lessons are unlocked sequentially — the frontend
 * decides which ones are accessible based on the user's progress.
 *
 * These routes are PUBLIC — no login required to read lesson content.
 *
 * Routes:
 *   GET    /lessons/:id  — returns a single lesson including its full content
 *   PUT    /lessons/:id  — update a lesson's title, content, or order (admin)
 *   DELETE /lessons/:id  — delete a lesson (admin)
 *
 * Mounted in index.js at: app.use("/lessons", lessonsRouter)
 */

const express           = require("express");
const router            = express.Router();
const db                = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");


// -------------------------------------------------------------------
// GET /lessons/:id
//
// Returns a single lesson by its numeric ID, including the full text
// content of the lesson and which module it belongs to.
//
// The GET /modules/:id route returns lesson metadata (title, order).
// This route provides the full content for when the user opens a lesson.
//
// Response:
//   { id, module_id, title, content, order_index, created_at }
// -------------------------------------------------------------------
router.get("/:id", async (req, res) => {
  // req.params.id is always a string, e.g. "3" — parse to a number
  const lessonId = parseInt(req.params.id, 10);

  // Reject the request early if the ID is not a valid integer
  if (isNaN(lessonId)) {
    return res.status(400).json({ error: "Lesson ID must be a number" });
  }

  try {
    const result = await db.query(
      `SELECT id, module_id, title, content, order_index, created_at
       FROM   lessons
       WHERE  id = $1`,
      [lessonId]
    );

    // If no rows returned, there is no lesson with that ID
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    // result.rows[0] is the single lesson object
    res.json(result.rows[0]);

  } catch (err) {
    console.error(`GET /lessons/${lessonId} error:`, err.message);
    res.status(500).json({ error: "Failed to fetch lesson" });
  }
});


// -------------------------------------------------------------------
// PUT /lessons/:id
//
// Updates a lesson's title, content, and/or order_index.
// Requires admin role. Only fields present in the body are changed.
//
// Request body (all optional, at least one required):
//   { "title": "New Title", "content": "...", "order_index": 3 }
//
// Response: updated lesson object
//   { id, module_id, title, content, order_index, created_at }
// -------------------------------------------------------------------
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) {
    return res.status(400).json({ error: "Lesson ID must be a number" });
  }

  const { title, content, order_index } = req.body;

  if (title === undefined && content === undefined && order_index === undefined) {
    return res.status(400).json({ error: "Provide at least one field to update: title, content, order_index" });
  }

  if (order_index !== undefined && (!Number.isInteger(order_index) || order_index < 1)) {
    return res.status(400).json({ error: "order_index must be a positive integer" });
  }

  try {
    const result = await db.query(
      `UPDATE lessons
       SET title       = COALESCE($1, title),
           content     = COALESCE($2, content),
           order_index = COALESCE($3, order_index)
       WHERE id = $4
       RETURNING id, module_id, title, content, order_index, created_at`,
      [title ?? null, content ?? null, order_index ?? null, lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A lesson with that order_index already exists in this module" });
    }
    console.error(`PUT /lessons/${lessonId} error:`, err.message);
    res.status(500).json({ error: "Failed to update lesson" });
  }
});


// -------------------------------------------------------------------
// DELETE /lessons/:id
//
// Deletes a lesson. Associated user_progress rows are removed by CASCADE.
// Requires admin role.
//
// Response 200: { message: "Lesson deleted" }
// Response 404: lesson not found
// -------------------------------------------------------------------
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const lessonId = parseInt(req.params.id, 10);
  if (isNaN(lessonId)) {
    return res.status(400).json({ error: "Lesson ID must be a number" });
  }

  try {
    const result = await db.query(
      `DELETE FROM lessons WHERE id = $1 RETURNING id`,
      [lessonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    res.json({ message: "Lesson deleted" });

  } catch (err) {
    console.error(`DELETE /lessons/${lessonId} error:`, err.message);
    res.status(500).json({ error: "Failed to delete lesson" });
  }
});


module.exports = router;
