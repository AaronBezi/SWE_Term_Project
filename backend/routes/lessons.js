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
 *   GET /lessons/:id  — returns a single lesson including its full content
 *
 * Mounted in index.js at: app.use("/lessons", lessonsRouter)
 */

const express = require("express");
const router  = express.Router();
const db      = require("../db");


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


module.exports = router;
