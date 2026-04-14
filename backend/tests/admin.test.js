/**
 * Integration tests for admin content creation routes.
 *
 * POST /admin/modules — create a new module (admin only)
 * POST /admin/lessons — create a new lesson  (admin only)
 */

jest.mock("../db");

process.env.SUPABASE_JWT_SECRET = "test-secret-32-chars-long-at-least!";
process.env.NODE_ENV = "test";

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");
const { adminToken, learnerToken } = require("./helpers");

beforeEach(() => {
  db.query.mockReset();
});

// ----------------------------------------------------------------
// POST /admin/modules
// ----------------------------------------------------------------
describe("POST /admin/modules", () => {
  it("creates a module when called by an admin", async () => {
    const created = { id: 5, title: "Openings", description: "Opening principles", order_index: 1, created_at: "2024-01-01" };
    db.query.mockResolvedValueOnce({ rows: [created] });

    const res = await request(app)
      .post("/admin/modules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Openings", description: "Opening principles", order_index: 1 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Openings");
    expect(res.body.order_index).toBe(1);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/admin/modules")
      .send({ title: "Openings", order_index: 1 });

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .post("/admin/modules")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ title: "Openings", order_index: 1 });

    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    const res = await request(app)
      .post("/admin/modules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ order_index: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  it("returns 400 when order_index is missing", async () => {
    const res = await request(app)
      .post("/admin/modules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Openings" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/order_index/i);
  });

  it("returns 409 when order_index already exists", async () => {
    const err = new Error("unique violation");
    err.code = "23505";
    db.query.mockRejectedValueOnce(err);

    const res = await request(app)
      .post("/admin/modules")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Duplicate", order_index: 1 });

    expect(res.status).toBe(409);
  });
});

// ----------------------------------------------------------------
// POST /admin/lessons
// ----------------------------------------------------------------
describe("POST /admin/lessons", () => {
  it("creates a lesson when called by an admin", async () => {
    // First query: module existence check; second: insert lesson
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [{ id: 20, module_id: 1, title: "Forks", content: null, order_index: 1, created_at: "2024-01-01" }],
      });

    const res = await request(app)
      .post("/admin/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ module_id: 1, title: "Forks", order_index: 1 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Forks");
  });

  it("returns 404 when the referenced module does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // module not found

    const res = await request(app)
      .post("/admin/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ module_id: 999, title: "Ghost Lesson", order_index: 1 });

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/module not found/i);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/admin/lessons")
      .send({ module_id: 1, title: "Forks", order_index: 1 });

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .post("/admin/lessons")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ module_id: 1, title: "Forks", order_index: 1 });

    expect(res.status).toBe(403);
  });

  it("returns 400 when module_id is missing", async () => {
    const res = await request(app)
      .post("/admin/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Forks", order_index: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/module_id/i);
  });

  it("returns 409 when order_index already exists in the module", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // module exists
    const err = new Error("unique violation");
    err.code = "23505";
    db.query.mockRejectedValueOnce(err);

    const res = await request(app)
      .post("/admin/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ module_id: 1, title: "Duplicate", order_index: 1 });

    expect(res.status).toBe(409);
  });
});
