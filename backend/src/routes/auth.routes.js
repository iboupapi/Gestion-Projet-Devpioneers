const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");

const store = require("../db/store");
const { signToken } = require("../utils/auth");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  },
});

const invitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de tentatives. Réessayez dans quelques minutes.",
  },
});

// Options communes du cookie d'authentification
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
};

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email et mot de passe requis.",
      });
    }

    const user = await store.find(
      "users",
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user || !user.password) {
      return res.status(401).json({
        error: "Identifiants incorrects ou compte non activé.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Ce compte a été désactivé.",
      });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({
        error: "Identifiants incorrects.",
      });
    }

    const token = signToken(user);

    res.cookie("dp_token", token, cookieOptions);

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
    
  } catch (err) {
    console.error("Erreur login:", err);

    return res.status(500).json({
      error: "Erreur serveur.",
    });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("dp_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(204).send();
});

// GET /api/auth/invitations/:token
router.get(
  "/invitations/:token",
  invitationLimiter,
  async (req, res) => {
    try {
      const invite = await store.find(
        "invitations",
        (i) => i.token === req.params.token
      );

      if (!invite) {
        return res.status(404).json({
          error: "Lien d'invitation invalide.",
        });
      }

      if (invite.usedAt) {
        return res.status(410).json({
          error: "Ce lien a déjà été utilisé.",
        });
      }

      if (new Date(invite.expiresAt) < new Date()) {
        return res.status(410).json({
          error: "Ce lien d'invitation a expiré.",
        });
      }

      const user = await store.find(
        "users",
        (u) => u.id === invite.userId
      );

      if (!user) {
        return res.status(404).json({
          error: "Utilisateur associé à l'invitation introuvable.",
        });
      }

      return res.json({
        email: user.email,
        name: user.name,
      });
    } catch (err) {
      console.error("Erreur vérification invitation:", err);

      return res.status(500).json({
        error: "Erreur serveur.",
      });
    }
  }
);

// POST /api/auth/invitations/:token/accept
router.post(
  "/invitations/:token/accept",
  invitationLimiter,
  async (req, res) => {
    try {
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({
          error: "Le mot de passe doit contenir au moins 6 caractères.",
        });
      }

      const invite = await store.find(
        "invitations",
        (i) => i.token === req.params.token
      );

      if (!invite) {
        return res.status(404).json({
          error: "Lien d'invitation invalide.",
        });
      }

      if (invite.usedAt) {
        return res.status(410).json({
          error: "Ce lien a déjà été utilisé.",
        });
      }

      if (new Date(invite.expiresAt) < new Date()) {
        return res.status(410).json({
          error: "Ce lien d'invitation a expiré.",
        });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await store.update(
        "users",
        invite.userId,
        {
          password: hashed,
          isActive: true,
        }
      );

      await store.update(
        "invitations",
        invite.id,
        {
          usedAt: new Date().toISOString(),
        }
      );

      const token = signToken(user);

      res.cookie("dp_token", token, cookieOptions);

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
        },
      });
    } catch (err) {
      console.error("Erreur acceptation invitation:", err);

      return res.status(500).json({
        error: "Erreur serveur.",
      });
    }
  }
);

module.exports = router;