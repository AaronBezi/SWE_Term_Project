/**
 * Integration tests for lesson routes.
 *
 * GET    /lessons/:id — fetch lesson with prerequisite enforcement (auth required)
 * PUT    /lessons/:id — update lesson (admin only)
 * DELETE /lessons/:id — delete lesson (admin only)
 */

jest.mock("../db");

process.env.SUPABASE_JWT_SECRET = "test-secret-32-chars-long-at-least!";
process.env.NODE_ENV = "test";

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");
const { learnerToken, adminToken, TEST_USER_ID } = require("./helpers");

beforeEach(() => {
  db.query.mockReset();
});

// ----------------------------------------------------------------
// GET /lessons/:id
// ----------------------------------------------------------------
describe("GET /lessons/:id", () => {
  it("returns the first lesson in the first module without prerequisite check", async () => {
    // Lesson with order_index 1 in the first module (no previous module)
    const lesson = { id: 10, module_id: 1, title: "Forks", content: "Learn forks.", order_index: 1, created_at: "2024-01-01" };
    db.query
      .mockResolvedValueOnce({ rows: [lesson] })  // fetch lesson
      .mockResolvedValueOnce({ rows: [] });         // no previous module exists

    const res = await request(app)
      .get("/lessons/10")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Forks");
  });

  it("returns 403 when the previous lesson in the module is not completed", async () => {
    // Lesson with order_index 2 — previous lesson (order_index 1) not completed
    const lesson = { id: 11, module_id: 1, title: "Pins", content: "Learn pins.", order_index: 2, created_at: "2024-01-01" };
    db.query
      .mockResolvedValueOnce({ rows: [lesson] })           // fetch lesson
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })       // previous lesson exists
      .mockResolvedValueOnce({ rows: [] });                  // no progress record → not completed

    const res = await request(app)
      .get("/lessons/11")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/previous lesson/i);
  });

  it("returns the lesson when the prerequisite lesson is completed", async () => {
    const lesson = { id: 11, module_id: 1, title: "Pins", content: "Learn pins.", order_index: 2, created_at: "2024-01-01" };
    db.query
      .mockResolvedValueOnce({ rows: [lesson] })            // fetch lesson
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })        // previous lesson exists
      .mockResolvedValueOnce({ rows: [{ id: 99 }] });       // progress record found → completed

    const res = await request(app)
      .get("/lessons/11")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Pins");
  });

  it("returns 403 when first lesson of a module but previous module is not finished", async () => {
    // First lesson of module 2; previous module 1 has 2 lessons, user completed 1
    const lesson = { id: 20, module_id: 2, title: "King and Pawn", content: "...", order_index: 1, created_at: "2024-01-01" };
    db.query
      .mockResolvedValueOnce({ rows: [lesson] })           // fetch lesson
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })        // previous module exists (module 1)
      .mockResolvedValueOnce({ rows: [{ total: "2" }] })   // module 1 has 2 lessons
      .mockResolvedValueOnce({ rows: [{ completed: "1" }] }); // user completed only 1

    const res = await request(app)
      .get("/lessons/20")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/previous module/i);
  });

  it("returns 404 when lesson does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/lessons/999")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/lessons/10");

    expect(res.status).toBe(401);
  });

  it("returns 400 for a non-numeric ID", async () => {
    const res = await request(app)
      .get("/lessons/abc")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(400);
  });
});

// ----------------------------------------------------------------
// PUT /lessons/:id  (admin only)
// ----------------------------------------------------------------
describe("PUT /lessons/:id", () => {
  it("updates a lesson when called by an admin", async () => {
    const updated = { id: 10, module_id: 1, title: "Updated Forks", content: "New content", order_index: 1, created_at: "2024-01-01" };
    db.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put("/lessons/10")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated Forks" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Forks");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).put("/lessons/10").send({ title: "X" });

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .put("/lessons/10")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ title: "X" });

    expect(res.status).toBe(403);
  });

  it("returns 400 when no update fields are provided", async () => {
    const res = await request(app)
      .put("/lessons/10")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ----------------------------------------------------------------
// DELETE /lessons/:id  (admin only)
// ----------------------------------------------------------------
describe("DELETE /lessons/:id", () => {
  it("deletes a lesson when called by an admin", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });

    const res = await request(app)
      .delete("/lessons/10")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).delete("/lessons/10");

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .delete("/lessons/10")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when the lesson does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete("/lessons/999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
