/**
 * Integration tests for admin user management routes.
 *
 * GET   /admin/users          — list all users with roles
 * PATCH /admin/users/:id/role — grant or revoke admin role
 */

jest.mock("../db");

// Mock the Supabase client before any module that imports it is required.
// We replace the real admin methods with jest.fn() so tests stay offline.
const mockListUsers   = jest.fn();
const mockUpdateUser  = jest.fn();

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      admin: {
        listUsers:        mockListUsers,
        updateUserById:   mockUpdateUser,
      },
    },
  }),
}));

process.env.SUPABASE_JWT_SECRET       = "test-secret-32-chars-long-at-least!";
process.env.SUPABASE_URL              = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-role-key";
process.env.NODE_ENV                  = "test";

const request = require("supertest");
const app     = require("../app");
const { adminToken, learnerToken, ADMIN_USER_ID } = require("./helpers");

// Two fake users for use across tests
const ADMIN_USER = {
  id:           ADMIN_USER_ID,
  email:        "admin@example.com",
  app_metadata: { role: "admin" },
  created_at:   "2024-01-01T00:00:00Z",
};
const LEARNER_USER = {
  id:           "c3d4e5f6-1234-4abc-8def-000000000099",
  email:        "learner@example.com",
  app_metadata: { role: "learner" },
  created_at:   "2024-02-01T00:00:00Z",
};

beforeEach(() => {
  mockListUsers.mockReset();
  mockUpdateUser.mockReset();
});

// ----------------------------------------------------------------
// GET /admin/users
// ----------------------------------------------------------------
describe("GET /admin/users", () => {
  it("returns a list of users with their roles", async () => {
    mockListUsers.mockResolvedValueOnce({
      data: { users: [ADMIN_USER, LEARNER_USER] },
      error: null,
    });

    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.find(u => u.email === "admin@example.com").role).toBe("admin");
    expect(res.body.find(u => u.email === "learner@example.com").role).toBe("learner");
  });

  it("defaults role to 'learner' when app_metadata.role is absent", async () => {
    const userWithoutRole = { ...LEARNER_USER, app_metadata: {} };
    mockListUsers.mockResolvedValueOnce({
      data: { users: [userWithoutRole] },
      error: null,
    });

    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body[0].role).toBe("learner");
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/admin/users");

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${learnerToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 500 when Supabase returns an error", async () => {
    mockListUsers.mockResolvedValueOnce({
      data: null,
      error: { message: "Supabase unavailable" },
    });

    const res = await request(app)
      .get("/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});

// ----------------------------------------------------------------
// PATCH /admin/users/:id/role
// ----------------------------------------------------------------
describe("PATCH /admin/users/:id/role", () => {
  it("grants admin role to a learner", async () => {
    // No listUsers call needed when granting (only needed when revoking)
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: { ...LEARNER_USER, app_metadata: { role: "admin" } } },
      error: null,
    });

    const res = await request(app)
      .patch(`/admin/users/${LEARNER_USER.id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "admin" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
    expect(res.body.id).toBe(LEARNER_USER.id);
  });

  it("revokes admin role when other admins still exist", async () => {
    const SECOND_ADMIN = {
      id:           "c3d4e5f6-1234-4abc-8def-000000000003",
      email:        "admin2@example.com",
      app_metadata: { role: "admin" },
      created_at:   "2024-01-01T00:00:00Z",
    };
    // listUsers is called to count remaining admins before revoking
    mockListUsers.mockResolvedValueOnce({
      data: { users: [ADMIN_USER, SECOND_ADMIN] },
      error: null,
    });
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: { ...SECOND_ADMIN, app_metadata: { role: "learner" } } },
      error: null,
    });

    const res = await request(app)
      .patch(`/admin/users/${SECOND_ADMIN.id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "learner" });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("learner");
  });

  it("returns 400 when trying to remove the last admin", async () => {
    mockListUsers.mockResolvedValueOnce({
      data: { users: [ADMIN_USER] }, // only one admin left
      error: null,
    });

    const res = await request(app)
      .patch(`/admin/users/${LEARNER_USER.id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "learner" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/last admin/i);
  });

  it("returns 400 when an admin tries to change their own role", async () => {
    const res = await request(app)
      .patch(`/admin/users/${ADMIN_USER_ID}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "learner" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/your own role/i);
  });

  it("returns 400 for an invalid role value", async () => {
    const res = await request(app)
      .patch(`/admin/users/${LEARNER_USER.id}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superuser" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/role must be/i);
  });

  it("returns 404 when the user ID does not exist in Supabase", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: null,
      error: { message: "User not found", status: 422 },
    });

    const res = await request(app)
      .patch(`/admin/users/c3d4e5f6-0000-0000-0000-000000000000/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "admin" });

    expect(res.status).toBe(404);
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .patch(`/admin/users/${LEARNER_USER.id}/role`)
      .send({ role: "admin" });

    expect(res.status).toBe(401);
  });

  it("returns 403 for a learner", async () => {
    const res = await request(app)
      .patch(`/admin/users/${LEARNER_USER.id}/role`)
      .set("Authorization", `Bearer ${learnerToken}`)
      .send({ role: "admin" });

    expect(res.status).toBe(403);
  });
});
