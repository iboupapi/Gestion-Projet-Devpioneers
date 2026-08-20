const { verifyToken } = require("../utils/auth");
const store = require("../db/store");

async function requireAuth(req, res, next) {
  const token = req.cookies?.dp_token;
  if (!token) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  try {
    const payload = verifyToken(token);
    const user = await store.find("users", (u) => u.id === payload.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Compte introuvable ou désactivé." });
    }
    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Session invalide ou expirée." });
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

module.exports = { requireAuth, requireRole };