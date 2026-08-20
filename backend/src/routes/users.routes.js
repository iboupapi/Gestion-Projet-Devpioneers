const express = require("express");
const store = require("../db/store");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uuid, generateInviteToken } = require("../utils/auth");
const { sendMail, invitationEmail } = require("../utils/mailer");

const router = express.Router();
router.use(requireAuth);

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, company: u.company, isActive: u.isActive };
}

// GET /api/users?role=DEVELOPER — liste des utilisateurs (admin uniquement)
router.get("/", requireRole("ADMIN"), async (req, res) => {
  const { role } = req.query;
  let users = await store.all("users");
  if (role) users = users.filter((u) => u.role === role);
  res.json(users.map(publicUser));
});

// Crée un utilisateur + son invitation (lien pour définir le mot de passe), envoie l'email.
// Réutilisé par la création de client/développeur et par la création d'admin.
async function createInvitedUser({ name, email, role, company }) {
  if (await store.find("users", (u) => u.email.toLowerCase() === email.toLowerCase())) {
    const err = new Error("Un compte existe déjà avec cet email.");
    err.status = 409;
    throw err;
  }

  const user = await store.insert("users", {
    id: uuid(),
    name,
    email,
    role,
    company: company || null,
    password: null,
    isActive: false, // activé une fois l'invitation acceptée et le mot de passe défini
    createdAt: new Date().toISOString(),
  });

  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(); // 7 jours
  const invitation = await store.insert("invitations", {
    id: uuid(),
    userId: user.id,
    token,
    expiresAt,
    usedAt: null,
    createdAt: new Date().toISOString(),
  });

  const invitationLink = `${process.env.FRONTEND_URL}/invitation/${invitation.token}`;

  const { subject, html } = invitationEmail({ name: user.name, token: invitation.token });
  sendMail({ to: user.email, subject, html }).catch((err) =>
    console.error("Erreur envoi email invitation:", err.message)
  );

  return { user, invitationLink };
}

// POST /api/users — l'admin crée un développeur ou un client (invitation automatique)
router.post("/", requireRole("ADMIN"), async (req, res) => {
  const { name, email, role, company } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Nom, email et rôle sont requis." });
  }
  if (!["DEVELOPER", "CLIENT"].includes(role)) {
    return res.status(400).json({ error: "Ce point d'entrée ne permet de créer que des clients ou développeurs." });
  }
  try {
    const { user, invitationLink } = await createInvitedUser({ name, email, role, company });
    res.status(201).json({ user: publicUser(user), invitationLink });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erreur serveur." });
  }
});

// POST /api/users/admins — crée un nouveau compte administrateur, via le même mécanisme
// d'invitation que les autres rôles (l'admin définit lui-même son mot de passe).
// Route séparée volontairement : créer un admin est plus sensible qu'un client/développeur.
router.post("/admins", requireRole("ADMIN"), async (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Nom et email sont requis." });
  }
  try {
    const { user, invitationLink } = await createInvitedUser({ name, email, role: "ADMIN" });
    res.status(201).json({ user: publicUser(user), invitationLink });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erreur serveur." });
  }
});

// PATCH /api/users/:id — modifier un utilisateur (nom, email, entreprise, rôle, statut actif)
router.patch("/:id", requireRole("ADMIN"), async (req, res) => {
  const { name, email, company, role, isActive } = req.body;
  const target = await store.find("users", (u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (role && role !== target.role && target.id === req.user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas changer votre propre rôle." });
  }
  if (isActive === false && target.id === req.user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas désactiver votre propre compte." });
  }
  if (email && email.toLowerCase() !== target.email.toLowerCase()) {
    const existing = await store.find("users", (u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(409).json({ error: "Un autre compte utilise déjà cet email." });
  }
  if (role && !["ADMIN", "DEVELOPER", "CLIENT"].includes(role)) {
    return res.status(400).json({ error: "Rôle invalide." });
  }
  if (role && role !== target.role) {
    if (target.role === "CLIENT") {
      const projectCount = (await store.filter("projects", (p) => p.clientId === target.id)).length;
      if (projectCount > 0) {
        return res.status(409).json({
          error: `Impossible de changer le rôle : ce client est encore rattaché à ${projectCount} projet(s). Réassignez ou supprimez ces projets d'abord.`,
        });
      }
    }
    if (target.role === "DEVELOPER") {
      const assignmentCount = (await store.filter("assignments", (a) => a.developerId === target.id)).length;
      if (assignmentCount > 0) {
        return res.status(409).json({
          error: `Impossible de changer le rôle : ce développeur est encore assigné à ${assignmentCount} projet(s). Retirez-le de ces projets d'abord.`,
        });
      }
    }
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (company !== undefined) updates.company = company || null;
  if (role !== undefined) updates.role = role;
  if (isActive !== undefined) updates.isActive = isActive;

  const user = await store.update("users", req.params.id, updates);
  res.json(publicUser(user));
});

// DELETE /api/users/:id — supprime définitivement un utilisateur.
// Bloqué par la base si l'utilisateur a un historique lié (projets, messages, assignations,
// images) : on renvoie alors un message clair invitant à désactiver le compte à la place.
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
  }
  const target = await store.find("users", (u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Utilisateur introuvable." });

  try {
    // Les invitations propres à ce compte (celle envoyée à sa création) ne concernent
    // que lui — on les supprime d'abord pour ne pas bloquer la suppression à tort.
    const ownInvitations = await store.filter("invitations", (i) => i.userId === target.id);
    for (const invite of ownInvitations) {
      await store.remove("invitations", invite.id);
    }

    await store.remove("users", req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.code === "P2003" || /foreign key/i.test(err.message || "")) {
      return res.status(409).json({
        error:
          "Ce compte a un historique lié (projets, messages, images ou assignations) et ne peut pas être supprimé définitivement. Désactivez-le à la place.",
      });
    }
    console.error("Erreur suppression utilisateur:", err.message);
    res.status(500).json({ error: "Erreur lors de la suppression." });
  }
});

module.exports = router;