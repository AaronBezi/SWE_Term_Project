/**
 * middleware/auth.js — Supabase JWT verification middleware
 *
 * Protects routes that require a logged-in user.
 *
 * How it works:
 *   1. The frontend logs the user in via Supabase Auth and receives a JWT.
 *   2. Every protected request must include that JWT in the Authorization header:
 *        Authorization: Bearer <token>
 *   3. This middleware extracts the token, verifies it using the
 *      SUPABASE_JWT_SECRET from .env, and attaches the decoded payload
 *      to req.user so route handlers can read the user's identity.
 *   4. If the token is missing, malformed, or expired the request is
 *      rejected immediately with a 401 Unauthorized response.
 *
 * Usage (in a route file):
 *   const { requireAuth } = require("../middleware/auth");
 *   router.get("/protected", requireAuth, (req, res) => { ... });
 *
 * After this middleware runs, req.user contains the decoded JWT payload.
 * The most important field is req.user.sub — the Supabase user's UUID.
 *
 * SUPABASE_JWT_SECRET:
 *   Found in Supabase Dashboard → Project Settings → API → JWT Secret
 *   Must be set in backend/.env
 */

const jwt = require("jsonwebtoken");

/**
 * requireAuth — Express middleware function
 *
 * @param {object} req  - Express request object
 * @param {object} res  - Express response object
 * @param {function} next - Calls the next middleware or route handler
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // The Authorization header must be present and follow the "Bearer <token>" format.
  // If it is missing or in the wrong format, reject the request immediately.
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization header is required. Format: Bearer <token>",
    });
  }

  // Split "Bearer eyJhbG..." → take only the token part after the space
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token's signature and check that it has not expired.
    // jwt.verify() throws an error if anything is wrong with the token.
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

    // Attach the decoded payload to the request so route handlers can use it.
    // Key fields in decoded:
    //   decoded.sub  — the user's Supabase UUID (e.g., "c3d4e5f6-...")
    //   decoded.role — the user's role (e.g., "authenticated")
    //   decoded.exp  — expiration timestamp (already validated by jwt.verify)
    req.user = decoded;

    // Pass control to the next middleware or the route handler
    next();
  } catch (err) {
    // jwt.verify() threw — token is invalid, expired, or tampered with
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { requireAuth };
