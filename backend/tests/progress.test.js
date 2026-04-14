/**
 * Integration tests for progress routes.
 *
 * GET  /progress — list completed lessons for current user (auth required)
 * POST /progress — mark a lesson complete (auth required)
 */

jest.mock("../db");

process.env.SUPABASE_JWT_SECRET = "test-secret-32-chars-long-at-least!";
process.env.NODE_ENV = "test";

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");
const { learnerToken, TEST_USER_ID } = require("./helpers");

beforeEach(() => {
  db.query.mockReset();
});

// ----------------------------------------------------------------
// GET /progress
// ----------------------------------------------------------------
describe("GET /progress", () => {
  it("returns completed lessons for the authenticated user", async () => {
    const rows = [
      {
        id: 1,
        lesson_id: 10,
        lesson_title: "Forks",
        module_id: 1,
        module_title: "Tactics",
        completed_at: "2024-01-01",
      },
    ];
    db.query.mockResolvedValueOnce({ rows });

    const res = await request(app)
      .get("/progress")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].lesson_title).toBe("Forks");
  });

  it("returns an empty array when the user has no progress", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/progress")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/progress");

    expect(res.status).toBe(401);
  });
});

// ----------------------------------------------------------------
// POST /progress
// ----------------------------------------------------------------
describe("POST /progress", () => {
  it("records lesson completion and returns 201", async () => {
    const progressRow = {
      id: 1,
      user_id: TEST_USER_ID,
      lesson_id: 10,
      completed_at: "2024-01-01",
    };
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })      // lesson exists
      .mockResolvedValueOnce({ rows: [] })                  // upsert user (no-op)
      .mockResolvedValueOnce({ rows: [progressRow] });      // insert progress

    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ lesson_id: 10 });

    expect(res.status).toBe(201);
    expect(res.body.lesson_id).toBe(10);
  });

  it("returns 200 when the lesson was already completed (idempotent)", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10 }] })  // lesson exists
      .mockResolvedValueOnce({ rows: [] })              // upsert user
      .mockResolvedValueOnce({ rows: [] });             // ON CONFLICT DO NOTHING — no row returned

    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ lesson_id: 10 });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/already/i);
  });

  it("returns 404 when the lesson does not exist", async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // lesson not found

    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ lesson_id: 999 });

    expect(res.status).toBe(404);
  });

  it("returns 400 when lesson_id is missing", async () => {
    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/lesson_id/i);
  });

  it("returns 400 when lesson_id is not an integer", async () => {
    const res = await request(app)
      .post("/progress")
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ lesson_id: 1.5 });

    expect(res.status).toBe(400);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/progress")
      .send({ lesson_id: 10 });

    expect(res.status).toBe(401);
  });
});
