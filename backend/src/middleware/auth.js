const { verifyToken } = require("../utils/auth");
const store = require("../db/store");

function extractToken(req) {
  // 1. En-tête standard Authorization: Bearer <token> (prioritaire, 100% fiable en cross-origin)
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Cookie dp_token parsé par cookie-parser
  if (req.cookies?.dp_token) {
    return req.cookies.dp_token;
  }

  // 3. Fallback : parsing manuel depuis l'en-tête Cookie brut au cas où
  const rawCookie = req.headers?.cookie;
  if (rawCookie) {
    const match = rawCookie.split(";").map((c) => c.trim()).find((c) => c.startsWith("dp_token="));
    if (match) {
      try {
        return decodeURIComponent(match.slice("dp_token=".length));
      } catch {
        return match.slice("dp_token=".length);
      }
    }
  }

  return null;
}

async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentification requise." });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }

  try {
    const user = await store.findById("users", payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Compte introuvable ou désactivé." });
    }
    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    console.error("[requireAuth] Erreur base de données:", err);
    return res.status(500).json({ error: "Erreur serveur lors de la vérification du compte." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé pour ce rôle." });
    }
    next();
  };
}

module.exports = { extractToken, requireAuth, requireRole };