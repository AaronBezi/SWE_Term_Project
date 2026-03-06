/**
 * routes/puzzles.js — API routes for lesson puzzles
 *
 * Puzzles belong to a lesson and are sourced from the Lichess puzzle database.
 * Each puzzle has a FEN position, a solution move sequence, a rating, and a
 * skill level (beginner / intermediate / advanced).
 *
 * These routes are PUBLIC — no login required.
 *
 * Routes:
 *   GET /puzzles/lesson/:lessonId             — all puzzles for a lesson
 *   GET /puzzles/lesson/:lessonId?skill=beginner — filtered by skill level
 *
 * Mounted in index.js at: app.use("/puzzles", puzzlesRouter)
 */

const express = require("express");
const router  = express.Router();
const db      = require("../db");

const VALID_SKILL_LEVELS = new Set(["beginner", "intermediate", "advanced"]);


// -------------------------------------------------------------------
// GET /puzzles/lesson/:lessonId
//
// Returns all puzzles for a given lesson, ordered by rating ascending
// (easiest first). Optionally filter by skill level via ?skill=
//
// Query params:
//   skill  — one of "beginner", "intermediate", "advanced" (optional)
//
// Response: array of puzzle objects
//   [ { id, lichess_id, fen, moves, rating, skill_level, themes }, ... ]
// -------------------------------------------------------------------
router.get("/lesson/:lessonId", async (req, res) => {
  const lessonId = parseInt(req.params.lessonId, 10);

  if (isNaN(lessonId)) {
    return res.status(400).json({ error: "Lesson ID must be a number" });
  }

  const { skill } = req.query;
  if (skill !== undefined && !VALID_SKILL_LEVELS.has(skill)) {
    return res.status(400).json({
      error: "skill must be one of: beginner, intermediate, advanced",
    });
  }

  try {
    // Confirm the lesson exists
    const lessonCheck = await db.query(
      `SELECT id FROM lessons WHERE id = $1`,
      [lessonId]
    );
    if (lessonCheck.rows.length === 0) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const result = skill
      ? await db.query(
          `SELECT id, lichess_id, fen, moves, rating, skill_level, themes
           FROM   puzzles
           WHERE  lesson_id   = $1
             AND  skill_level = $2
           ORDER  BY rating ASC`,
          [lessonId, skill]
        )
      : await db.query(
          `SELECT id, lichess_id, fen, moves, rating, skill_level, themes
           FROM   puzzles
           WHERE  lesson_id = $1
           ORDER  BY rating ASC`,
          [lessonId]
        );

    res.json(result.rows);

  } catch (err) {
    console.error(`GET /puzzles/lesson/${lessonId} error:`, err.message);
    res.status(500).json({ error: "Failed to fetch puzzles" });
  }
});


module.exports = router;
