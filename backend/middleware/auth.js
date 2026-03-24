const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The public key from your Supabase project's JWKS endpoint
// https://qtoaimacapyltavxyqwi.supabase.co/auth/v1/.well-known/jwks.json
const SUPABASE_JWK = {
  alg: "ES256",
  crv: "P-256",
  ext: true,
  key_ops: ["verify"],
  kid: "ca43045f-9390-4bae-8b0b-e09380036c01",
  kty: "EC",
  use: "sig",
  x: "mw_I4ykgZLwWL6dl5UJ4sojryKFNa-aBK7gdSa00IWo",
  y: "KeGN2oCgh2A0IxtW1Q08puQJkbLOexfYOwMzrdpeiS4"
};

// Convert the JWK to a PEM formatted public key that jsonwebtoken can use
const PUBLIC_KEY_PEM = jwkToPem(SUPABASE_JWK);

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authorization header is required. Format: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, PUBLIC_KEY_PEM, {
      algorithms: ["ES256"],
    });

    if (!decoded.sub || !UUID_REGEX.test(decoded.sub)) {
      return res.status(401).json({
        error: "Invalid token: missing or malformed user ID",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

const db = require("../db");

async function requireAdmin(req, res, next) {
  try {
    const result = await db.query(
      `SELECT role FROM users WHERE id = $1`,
      [req.user.sub]
    );

    if (result.rows.length === 0 || result.rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (err) {
    console.error("requireAdmin error:", err.message);
    res.status(500).json({ error: "Failed to verify admin role" });
  }
}

module.exports = { requireAuth, requireAdmin };