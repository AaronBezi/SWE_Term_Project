/**
 * Integration tests for module routes.
 *
 * GET /modules        — public, returns list
 * GET /modules/:id    — public, returns module with lessons
 * PUT /modules/:id    — admin only, updates a module
 * DELETE /modules/:id — admin only, deletes a module
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
// GET /modules
// ----------------------------------------------------------------
describe("GET /modules", () => {
  it("returns all modules sorted by order_index", async () => {
    const rows = [
      { id: 1, title: "Tactics",  description: null, order_index: 1, created_at: "2024-01-01" },
      { id: 2, title: "Endgames", description: null, order_index: 2, created_at: "2024-01-01" },
    ];
    db.query.mockResolvedValueOnce({ rows });

    const res = await request(app).get("/modules");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("Tactics");
  });

  it("returns 500 if the database fails", async () => {
    db.query.mockRejectedValueOnce(new Error("DB down"));

    const res = await request(app).get("/modules");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ----------------------------------------------------------------
// GET /modules/:id
// ----------------------------------------------------------------
describe("GET /modules/:id", () => {
  it("returns module with its lessons", async () => {
    const module = { id: 1, title: "Tactics", description: null, order_index: 1, created_at: "2024-01-01" };
    const lessons = [
      { id: 10, title: "Forks", order_index: 1, created_at: "2024-01-01" },
      { id: 11, title: "Pins",  order_index: 2, created_at: "2024-01-01" },
    ];
    db.query
      .mockResolvedValueOnce({ rows: [module] })  // module query
      .mockResolvedValueOnce({ rows: lessons });   // lessons query

    const res = await request(app).get("/modules/1");

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Tactics");
    expect(res.body.lessons).toHaveLength(2);
    expect(res.body.lessons[0].title).toBe("Forks");
  });

  it("returns 404 when module does not exist", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })  // module not found
      .mockResolvedValueOnce({ rows: [] }); // lessons (not reached but safe)

    const res = await request(app).get("/modules/999");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns 400 for a non-numeric ID", async () => {
    const res = await request(app).get("/modules/abc");

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/number/i);
  });
});

// ----------------------------------------------------------------
// PUT /modules/:id  (admin only)
// ----------------------------------------------------------------
describe("PUT /modules/:id", () => {
  it("updates a module when called by an admin", async () => {
    const updated = { id: 1, title: "Updated Tactics", description: null, order_index: 1, created_at: "2024-01-01" };
    db.query.mockResolvedValueOnce({ rows: [updated] });

    const res = await request(app)
      .put("/modules/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Updated Tactics" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Tactics");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).put("/modules/1").send({ title: "X" });

    expect(res.status).toBe(401);
  });

  it("returns 403 when called by a non-admin user", async () => {
    const res = await request(app)
      .put("/modules/1")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ title: "X" });

    expect(res.status).toBe(403);
  });

  it("returns 400 when no update fields are provided", async () => {
    const res = await request(app)
      .put("/modules/1")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 when the module does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put("/modules/999")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Ghost" });

    expect(res.status).toBe(404);
  });
});

// ----------------------------------------------------------------
// DELETE /modules/:id  (admin only)
// ----------------------------------------------------------------
describe("DELETE /modules/:id", () => {
  it("deletes a module when called by an admin", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete("/modules/1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).delete("/modules/1");

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .delete("/modules/1")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when the module does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete("/modules/999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });
});
