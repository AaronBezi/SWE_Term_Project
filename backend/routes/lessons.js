/**
 * routes/lessons.js — API routes for individual chess lessons
 *
 * A lesson belongs to a module and contains the actual learning content
 * the user reads/watches. Lessons are unlocked sequentially — the frontend
 * decides which ones are accessible based on the user's progress.
 *
 * Routes:
 *   GET    /lessons/:id  — returns lesson content (requires auth + prerequisite check)
 *   PUT    /lessons/:id  — update a lesson's title, content, or order (admin)
 *   DELETE /lessons/:id  — delete a lesson (admin)
 *
 * Mounted in index.js at: app.use("/lessons", lessonsRouter)
 */

const express           = require("express");
const router            = express.Router();
const db                = require("../db");
const { requireAuth, requireAdminRole } = require("../middleware/auth");


// -------------------------------------------------------------------
// GET /lessons/:id
//
// Returns a single lesson by its numeric ID, including the full text
// content of the lesson and which module it belongs to.
//
// Requires the user to be logged in (Bearer token).
//
// Prerequisite enforcement:
//   Lessons must be completed in order. Before returning the lesson,
//   we check whether the user has already completed the lesson that
//   comes before the requested one.
//
//   Within a module:
//     Lesson at order_index N requires lesson at order_index N-1
//     in the same module to be completed first.
//
//   First lesson of a module (order_index = 1):
//     Requires ALL lessons in the previous module (by order_index)
//     to be completed. If there is no previous module, the lesson
//     is the very start of the course and is always accessible.
//
// Response:
//   { id, module_id, title, content, order_index, created_at }
//
// Response 403: prerequisite not met
// -------------------------------------------------------------------
router.get("/:id", requireAuth, async (req, res) => {
  const lessonId = parseInt(req.params.id, 10);

  if (isNaN(lessonId)) {
    return res.status(400).json({ error: "Lesson ID must be a number" });
  }

  const userId = req.user.sub;

  try {
    // Fetch the requested lesson so we know its module and position
    const lessonResult = await db.query(
      `SELECT id, module_id, title, content, order_index, created_at
       FROM   lessons
       WHERE  id = $1`,
      [lessonId]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const lesson = lessonResult.rows[0];

    // ------------------------------------------------------------------
    // Prerequisite check
    // ------------------------------------------------------------------

    if (lesson.order_index === 1) {
      // This is the first lesson in its module.
      // Find the module that comes directly before this one in the course
      // (the module with the highest order_index that is still less than ours).
      const prevModuleResult = await db.query(
        `SELECT id FROM modules
         WHERE  order_index < (SELECT order_index FROM modules WHERE id = $1)
         ORDER  BY order_index DESC
         LIMIT  1`,
        [lesson.module_id]
      );

      if (prevModuleResult.rows.length > 0) {
        // A previous module exists — the user must have finished ALL of its lessons.
        const prevModuleId = prevModuleResult.rows[0].id;

        // Count total lessons in the previous module
        const totalResult = await db.query(
          `SELECT COUNT(*) AS total FROM lessons WHERE module_id = $1`,
          [prevModuleId]
        );

        // Count how many of those lessons this user has completed
        const completedResult = await db.query(
          `SELECT COUNT(*) AS completed
           FROM   user_progress up
           JOIN   lessons l ON up.lesson_id = l.id
           WHERE  l.module_id = $1
             AND  up.user_id  = $2`,
          [prevModuleId, userId]
        );

        const total     = parseInt(totalResult.rows[0].total, 10);
        const completed = parseInt(completedResult.rows[0].completed, 10);

        if (completed < total) {
          return res.status(403).json({
            error: "Complete the previous module first",
          });
        }
      }
      // If no previous module exists, this is the start of the course — allow access.

    } else {
      // This is not the first lesson in its module.
      // The user must have completed the lesson directly before this one
      // (same module, order_index one lower).
      const prevLessonResult = await db.query(
        `SELECT id FROM lessons
         WHERE  module_id   = $1
           AND  order_index = $2`,
        [lesson.module_id, lesson.order_index - 1]
      );

      if (prevLessonResult.rows.length > 0) {
        const prevLessonId = prevLessonResult.rows[0].id;

        const progressResult = await db.query(
          `SELECT id FROM user_progress
           WHERE  user_id   = $1
             AND  lesson_id = $2`,
          [userId, prevLessonId]
        );

        if (progressResult.rows.length === 0) {
          return res.status(403).json({
            error: "Complete the previous lesson first",
          });
        }
      }
    }

    // All prerequisite checks passed — return the lesson content
    res.json(lesson);

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
router.put("/:id", requireAuth, requireAdminRole, async (req, res) => {
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
router.delete("/:id", requireAuth, requireAdminRole, async (req, res) => {
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
