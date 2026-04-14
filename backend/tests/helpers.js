/**
 * Test helpers — JWT generation for integration tests.
 *
 * We sign tokens with the same secret set in process.env.SUPABASE_JWT_SECRET
 * so requireAuth middleware accepts them without hitting Supabase.
 */

const jwt = require("jsonwebtoken");

const TEST_SECRET = "test-secret-32-chars-long-at-least!";
const TEST_USER_ID = "c3d4e5f6-1234-4abc-8def-000000000001";
const ADMIN_USER_ID = "c3d4e5f6-1234-4abc-8def-000000000002";

function makeToken(userId, role = "learner") {
  return jwt.sign(
    {
      sub: userId,
      role: "authenticated",
      app_metadata: { role },
    },
    TEST_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
}

/** Bearer token for a regular authenticated user */
const learnerToken = makeToken(TEST_USER_ID, "learner");

/** Bearer token for an admin user */
const adminToken = makeToken(ADMIN_USER_ID, "admin");

module.exports = { learnerToken, adminToken, TEST_USER_ID, ADMIN_USER_ID };
