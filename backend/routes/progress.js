/**
 * routes/progress.js — API routes for tracking user lesson completion
 *
 * Progress records link a user to a lesson they have finished.
 * The frontend uses this data to:
 *   - Show which lessons are already completed (checkmarks, etc.)
 *   - Determine which lesson is next and whether it is unlocked
 *
 * All routes here are PROTECTED — a valid Supabase JWT is required.
 * The requireAuth middleware verifies the token and sets req.user.
 * req.user.sub is the Supabase user UUID, used as the user identifier.
 *
 * Routes:
 *   GET  /progress   — list all lessons the current user has completed
 *   POST /progress   — mark a lesson as completed for the current user
 *
 * Mounted in index.js at: app.use("/progress", progressRouter)
 */

const express     = require("express");
const router      = express.Router();
const db          = require("../db");
const { requireAuth } = require("../middleware/auth");

// Apply requireAuth to every route in this file.
// Any request without a valid Bearer token will be rejected before
// reaching the GET or POST handlers below.
router.use(requireAuth);


// -------------------------------------------------------------------
// GET /progress/module-completion
//
// Returns every module with a breakdown of how many lessons the user
// has completed and whether the module is fully complete.
//
// A module is considered complete when completed_lessons === total_lessons
// AND total_lessons > 0 (a module with no lessons is never "complete").
//
// Response: array ordered by module order_index
//   [
//     {
//       module_id, module_title, order_index,
//       total_lessons,      -- number of lessons in this module
//       completed_lessons,  -- how many the user has finished
//       is_complete         -- true when all lessons are done
//     },
//     ...
//   ]
// -------------------------------------------------------------------
router.get("/module-completion", async (req, res) => {
  const userId = req.user.sub;

  try {
    // Single query: left-join modules → lessons → user_progress so that
    // modules with no lessons still appear (with totals of 0).
    const result = await db.query(
      `SELECT
         m.id           AS module_id,
         m.title        AS module_title,
         m.order_index,
         COUNT(l.id)::int                    AS total_lessons,
         COUNT(up.id)::int                   AS completed_lessons,
         COUNT(l.id) > 0
           AND COUNT(l.id) = COUNT(up.id)    AS is_complete
       FROM   modules m
       LEFT JOIN lessons l
              ON l.module_id = m.id
       LEFT JOIN user_progress up
              ON up.lesson_id = l.id
             AND up.user_id   = $1
       GROUP  BY m.id, m.title, m.order_index
       ORDER  BY m.order_index ASC`,
      [userId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET /progress/module-completion error:", err.message);
    res.status(500).json({ error: "Failed to fetch module completion" });
  }
});


// -------------------------------------------------------------------
// GET /progress
//
// Returns every lesson the authenticated user has completed, along with
// context about which module each lesson belongs to.
//
// The user is identified by req.user.sub — the UUID from the JWT.
//
// Response: array of progress records
//   [
//     {
//       id, lesson_id, lesson_title,
//       module_id, module_title,
//       completed_at
//     },
//     ...
//   ]
// -------------------------------------------------------------------
router.get("/", async (req, res) => {
  // req.user.sub is the Supabase user UUID set by the requireAuth middleware
  const userId = req.user.sub;

  try {
    // Join user_progress with lessons and modules so the response includes
    // human-readable titles instead of just IDs
    const result = await db.query(
      `SELECT
         up.id,
         up.lesson_id,
         l.title       AS lesson_title,
         l.module_id,
         m.title       AS module_title,
         up.completed_at
       FROM   user_progress up
       JOIN   lessons l ON up.lesson_id  = l.id
       JOIN   modules m ON l.module_id   = m.id
       WHERE  up.user_id = $1
       ORDER  BY up.completed_at ASC`,
      [userId]
    );

    // result.rows is an array — one object per completed lesson
    res.json(result.rows);

  } catch (err) {
    console.error("GET /progress error:", err.message);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});


// -------------------------------------------------------------------
// POST /progress
//
// Marks a specific lesson as completed for the authenticated user.
// Idempotent — submitting the same lesson_id twice will not cause an
// error or create a duplicate record; it just returns a 200.
//
// Request body:
//   { "lesson_id": 3 }
//
// Response on first completion (201 Created):
//   { id, user_id, lesson_id, completed_at }
//
// Response if lesson was already completed (200 OK):
//   { message: "Lesson already marked as completed" }
// -------------------------------------------------------------------
router.post("/", async (req, res) => {
  // req.user.sub is the Supabase user UUID set by the requireAuth middleware
  const userId    = req.user.sub;
  const { lesson_id } = req.body;

  // Validate that lesson_id is present, is a positive integer, and not a float.
  // - lesson_id == null catches both undefined and null (body field missing entirely)
  // - Number.isInteger() rejects floats like 3.5
  // - lesson_id > 0 rejects zero and negative numbers (DB IDs start at 1)
  if (lesson_id == null || !Number.isInteger(lesson_id) || lesson_id < 1) {
    return res.status(400).json({
      error: "lesson_id is required and must be a positive integer",
    });
  }

  try {
    // --- Step 1: ensure the lesson exists before recording progress ---
    // Also fetch module_id so we can check module completion afterwards.
    const lessonCheck = await db.query(
      `SELECT id, module_id FROM lessons WHERE id = $1`,
      [lesson_id]
    );

    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const { module_id } = lessonCheck.rows[0];

    // --- Step 2: ensure the user exists in our local users table ---
    // In production, Supabase's trigger creates the user row automatically.
    // Locally (no trigger), we upsert here so testing works without
    // manually pre-populating the users table.
    await db.query(
      `INSERT INTO users (id, role)
       VALUES ($1, 'learner')
       ON CONFLICT (id) DO NOTHING`,
      [userId]
    );

    // --- Step 3: insert the progress record ---
    // ON CONFLICT DO NOTHING handles duplicate submissions gracefully.
    // RETURNING gives us the newly created row (or nothing if it existed).
    const result = await db.query(
      `INSERT INTO user_progress (user_id, lesson_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, lesson_id) DO NOTHING
       RETURNING id, user_id, lesson_id, completed_at`,
      [userId, lesson_id]
    );

    // If RETURNING came back empty, the record already existed — no insert happened
    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Lesson already marked as completed" });
    }

    // --- Step 4: detect module completion ---
    // A module is complete when every lesson in it has a progress record
    // for this user. We check this immediately after the insert so the
    // frontend receives the signal in the same response.
    const completionCheck = await db.query(
      `SELECT
         COUNT(l.id)::int                  AS total_lessons,
         COUNT(up.id)::int                 AS completed_lessons
       FROM   lessons l
       LEFT JOIN user_progress up
              ON up.lesson_id = l.id
             AND up.user_id   = $1
       WHERE  l.module_id = $2`,
      [userId, module_id]
    );

    const { total_lessons, completed_lessons } = completionCheck.rows[0];
    const module_completed = total_lessons > 0 && total_lessons === completed_lessons;

    // 201 Created — return the new progress record plus module completion signal
    res.status(201).json({
      ...result.rows[0],
      module_id,
      module_completed,
    });

  } catch (err) {
    console.error("POST /progress error:", err.message);
    res.status(500).json({ error: "Failed to record progress" });
  }
});


module.exports = router;
