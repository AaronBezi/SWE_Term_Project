/**
 * routes/admin.js — Admin-only API routes for creating content
 *
 * These routes allow admins to create new modules and lessons.
 * All routes require the user to be logged in AND have admin role.
 *
 * How admin role works:
 *   Supabase stores the role in the JWT's app_metadata field.
 *   The requireAdminRole middleware reads that field directly from
 *   the already-verified token — no extra database query needed.
 *   To grant a user admin access, set app_metadata.role = "admin"
 *   via the Supabase Dashboard or service role API.
 *
 * Routes:
 *   POST /admin/modules  — create a new module
 *   POST /admin/lessons  — create a new lesson inside a module
 *
 * Mounted in index.js at: app.use("/admin", adminRouter)
 */

const express                        = require("express");
const router                         = express.Router();
const db                             = require("../db");
const { requireAuth, requireAdminRole } = require("../middleware/auth");

// Apply both auth checks to every route in this file.
// Any request without a valid token, or from a non-admin user, is rejected
// before it ever reaches the POST handlers below.
router.use(requireAuth, requireAdminRole);


// -------------------------------------------------------------------
// POST /admin/modules
//
// Creates a new chess learning module.
//
// Required body fields:
//   title       (string)  — display name for the module
//   order_index (integer) — position in the course sequence (must be unique)
//
// Optional body fields:
//   description (string)  — short summary shown on the module list page
//
// Response 201: the newly created module object
//   { id, title, description, order_index, created_at }
//
// Response 409: another module already has that order_index
// -------------------------------------------------------------------
router.post("/modules", async (req, res) => {
  const { title, description, order_index } = req.body;

  // title is required — it is the display name shown to learners
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }

  // order_index is required — it controls where the module appears in the course
  if (order_index == null || !Number.isInteger(order_index) || order_index < 1) {
    return res.status(400).json({ error: "order_index is required and must be a positive integer" });
  }

  try {
    const result = await db.query(
      `INSERT INTO modules (title, description, order_index)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, order_index, created_at`,
      [title.trim(), description ?? null, order_index]
    );

    // 201 Created — return the new module row
    res.status(201).json(result.rows[0]);

  } catch (err) {
    // PostgreSQL error code 23505 = unique_violation
    // This fires when another module already has the same order_index
    if (err.code === "23505") {
      return res.status(409).json({ error: "A module with that order_index already exists" });
    }
    console.error("POST /admin/modules error:", err.message);
    res.status(500).json({ error: "Failed to create module" });
  }
});


// -------------------------------------------------------------------
// POST /admin/lessons
//
// Creates a new lesson inside an existing module.
//
// Required body fields:
//   module_id   (integer) — ID of the module this lesson belongs to
//   title       (string)  — display name for the lesson
//   order_index (integer) — position within the module (must be unique per module)
//
// Optional body fields:
//   content (string) — the full lesson text/content shown to learners
//
// Response 201: the newly created lesson object
//   { id, module_id, title, content, order_index, created_at }
//
// Response 404: the given module_id does not exist
// Response 409: another lesson in this module already has that order_index
// -------------------------------------------------------------------
router.post("/lessons", async (req, res) => {
  const { module_id, title, content, order_index } = req.body;

  // module_id is required — a lesson must belong to an existing module
  if (module_id == null || !Number.isInteger(module_id) || module_id < 1) {
    return res.status(400).json({ error: "module_id is required and must be a positive integer" });
  }

  // title is required — it is the display name shown to learners
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }

  // order_index is required — it controls the lesson's position within the module
  if (order_index == null || !Number.isInteger(order_index) || order_index < 1) {
    return res.status(400).json({ error: "order_index is required and must be a positive integer" });
  }

  try {
    // Confirm the referenced module actually exists before inserting.
    // Without this check, a typo in module_id would cause a FK violation
    // with a confusing database error instead of a clear 404.
    const moduleCheck = await db.query(
      `SELECT id FROM modules WHERE id = $1`,
      [module_id]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: "Module not found" });
    }

    const result = await db.query(
      `INSERT INTO lessons (module_id, title, content, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING id, module_id, title, content, order_index, created_at`,
      [module_id, title.trim(), content ?? null, order_index]
    );

    // 201 Created — return the new lesson row
    res.status(201).json(result.rows[0]);

  } catch (err) {
    // PostgreSQL error code 23505 = unique_violation
    // This fires when another lesson in the same module has the same order_index
    if (err.code === "23505") {
      return res.status(409).json({ error: "A lesson with that order_index already exists in this module" });
    }
    console.error("POST /admin/lessons error:", err.message);
    res.status(500).json({ error: "Failed to create lesson" });
  }
});


module.exports = router;
