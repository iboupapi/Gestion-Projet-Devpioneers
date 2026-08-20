const express = require("express");
const store = require("../db/store");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uuid } = require("../utils/auth");
const { canAccessProject, serializeProject } = require("../utils/projectAccess");

const router = express.Router();
router.use(requireAuth);

// GET /api/projects — projets visibles selon le rôle
router.get("/", async (req, res) => {
  const { user } = req;
  let projects = await store.all("projects");

  if (user.role === "CLIENT") {
    projects = projects.filter((p) => p.clientId === user.id);
  } else if (user.role === "DEVELOPER") {
    const myAssignments = await store.filter("assignments", (a) => a.developerId === user.id);
    const myProjectIds = new Set(myAssignments.map((a) => a.projectId));
    projects = projects.filter((p) => myProjectIds.has(p.id));
  }
  // ADMIN voit tout

  res.json(await Promise.all(projects.map(serializeProject)));
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (!(await canAccessProject(req.user, project))) {
    return res.status(403).json({ error: "Vous n'avez pas accès à ce projet." });
  }
  res.json(await serializeProject(project));
});

// POST /api/projects — admin crée un projet + assigne des développeurs
router.post("/", requireRole("ADMIN"), async (req, res) => {
  const { name, description, clientId, dueDate, developerIds } = req.body;
  if (!name || !clientId) {
    return res.status(400).json({ error: "Nom du projet et client sont requis." });
  }
  const client = await store.find("users", (u) => u.id === clientId && u.role === "CLIENT");
  if (!client) return res.status(404).json({ error: "Client introuvable." });

  const project = await store.insert("projects", {
    id: uuid(),
    name,
    description: description || "",
    status: "EN_ATTENTE",
    clientId,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    deliveredAt: null,
    maintenanceActive: false,
    readyToClose: false,
    createdAt: new Date().toISOString(),
  });

  for (const developerId of developerIds || []) {
    await store.insert("assignments", {
      id: uuid(),
      projectId: project.id,
      developerId,
      assignedAt: new Date().toISOString(),
    });
  }

  res.status(201).json(await serializeProject(project));
});

// PATCH /api/projects/:id/assign — admin modifie les développeurs assignés
router.patch("/:id/assign", requireRole("ADMIN"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  const { developerIds } = req.body;

  const existing = await store.filter("assignments", (a) => a.projectId === project.id);
  for (const a of existing) await store.remove("assignments", a.id);
  for (const developerId of developerIds || []) {
    await store.insert("assignments", {
      id: uuid(),
      projectId: project.id,
      developerId,
      assignedAt: new Date().toISOString(),
    });
  }

  res.json(await serializeProject(project));
});

// PATCH /api/projects/:id/status — changer le statut (admin, ou dev pour En cours/En révision/Livré)
router.patch("/:id/status", async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (!(await canAccessProject(req.user, project)) || req.user.role === "CLIENT") {
    return res.status(403).json({ error: "Action non autorisée." });
  }
  const { status } = req.body;
  const allowed = ["EN_ATTENTE", "EN_COURS", "EN_REVISION", "LIVRE", "TERMINE"];
  if (!allowed.includes(status)) return res.status(400).json({ error: "Statut invalide." });

  // Seul l'admin peut clôturer directement (TERMINE)
  if (status === "TERMINE" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Seul l'administrateur peut clôturer un projet." });
  }

  const patch = { status };
  if (status === "LIVRE" && !project.deliveredAt) {
    patch.deliveredAt = new Date().toISOString();
  }
  const updated = await store.update("projects", project.id, patch);
  res.json(await serializeProject(updated));
});

// POST /api/projects/:id/signal-ready — le développeur signale que le projet est prêt à être clôturé
router.patch("/:id/signal-ready", requireRole("DEVELOPER"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (!(await canAccessProject(req.user, project))) {
    return res.status(403).json({ error: "Vous n'êtes pas assigné à ce projet." });
  }
  const updated = await store.update("projects", project.id, { readyToClose: true });
  res.json(await serializeProject(updated));
  // TODO email : notifier l'admin qu'un projet est prêt à être clôturé
});

// PATCH /api/projects/:id/close — l'admin valide la clôture (après signalement du dev)
router.patch("/:id/close", requireRole("ADMIN"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  const updated = await store.update("projects", project.id, { status: "TERMINE", readyToClose: false });
  res.json(await serializeProject(updated));
});

// PATCH /api/projects/:id/maintenance — le client active la maintenance (uniquement si Livré)
router.patch("/:id/maintenance", requireRole("CLIENT"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (project.clientId !== req.user.id) {
    return res.status(403).json({ error: "Ce projet ne vous appartient pas." });
  }
  if (project.status !== "LIVRE" && !project.maintenanceActive) {
    return res.status(400).json({ error: "La maintenance ne peut être activée qu'une fois le projet livré." });
  }
  const updated = await store.update("projects", project.id, {
    maintenanceActive: true,
    status: "MAINTENANCE",
  });
  res.json(await serializeProject(updated));
  // TODO email : notifier l'admin que le client a activé la maintenance
});

// PATCH /api/projects/:id/maintenance/cancel — le client désactive la maintenance
router.patch("/:id/maintenance/cancel", requireRole("CLIENT"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (project.clientId !== req.user.id) {
    return res.status(403).json({ error: "Ce projet ne vous appartient pas." });
  }
  if (!project.maintenanceActive) {
    return res.status(400).json({ error: "La maintenance n'est pas active sur ce projet." });
  }
  const updated = await store.update("projects", project.id, {
    maintenanceActive: false,
    status: "LIVRE",
  });
  res.json(await serializeProject(updated));
});

// GET /api/projects/due-date-requests/pending — toutes les demandes en attente, tous
// projets confondus — utilisé par l'admin pour les traiter depuis un seul endroit.
router.get("/due-date-requests/pending", requireRole("ADMIN"), async (req, res) => {
  const pending = await store.filter("dueDateRequests", (r) => r.status === "EN_ATTENTE");
  const enriched = await Promise.all(
    pending.map(async (r) => {
      const project = await store.find("projects", (p) => p.id === r.projectId);
      const requester = await store.find("users", (u) => u.id === r.requestedById);
      return {
        ...r,
        project: project ? { id: project.id, name: project.name } : null,
        requestedBy: requester ? { id: requester.id, name: requester.name, company: requester.company } : null,
      };
    })
  );
  res.json(enriched.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
});

// POST /api/projects/:id/due-date-requests — le client propose une nouvelle échéance,
// avec justification obligatoire. Une seule demande en attente à la fois par projet.
router.post("/:id/due-date-requests", requireRole("CLIENT"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (project.clientId !== req.user.id) {
    return res.status(403).json({ error: "Ce projet ne vous appartient pas." });
  }
  const { proposedDueDate, justification } = req.body;
  if (!proposedDueDate || !justification || !justification.trim()) {
    return res.status(400).json({ error: "La nouvelle échéance et une justification sont requises." });
  }
  const pending = await store.find(
    "dueDateRequests",
    (r) => r.projectId === project.id && r.status === "EN_ATTENTE"
  );
  if (pending) {
    return res.status(409).json({ error: "Une demande est déjà en attente de validation pour ce projet." });
  }
  const request = await store.insert("dueDateRequests", {
    id: uuid(),
    projectId: project.id,
    requestedById: req.user.id,
    proposedDueDate: new Date(proposedDueDate).toISOString(),
    justification: justification.trim(),
    status: "EN_ATTENTE",
    reviewedById: null,
    reviewComment: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(request);
  // TODO email : notifier l'admin qu'une nouvelle échéance est proposée
});

// GET /api/projects/:id/due-date-requests — historique des demandes pour ce projet
router.get("/:id/due-date-requests", async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  if (!(await canAccessProject(req.user, project))) {
    return res.status(403).json({ error: "Vous n'avez pas accès à ce projet." });
  }
  const requests = (await store.filter("dueDateRequests", (r) => r.projectId === project.id)).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(requests);
});

// PATCH /api/projects/:id/due-date-requests/:requestId — l'admin valide ou rejette
// (justification obligatoire en cas de rejet, même logique que la validation de maquette)
router.patch("/:id/due-date-requests/:requestId", requireRole("ADMIN"), async (req, res) => {
  const project = await store.find("projects", (p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: "Projet introuvable." });
  const request = await store.find(
    "dueDateRequests",
    (r) => r.id === req.params.requestId && r.projectId === project.id
  );
  if (!request) return res.status(404).json({ error: "Demande introuvable." });
  if (request.status !== "EN_ATTENTE") {
    return res.status(400).json({ error: "Cette demande a déjà été traitée." });
  }
  const { approved, comment } = req.body;
  if (typeof approved !== "boolean") {
    return res.status(400).json({ error: "Le champ 'approved' (true/false) est requis." });
  }
  if (approved === false && (!comment || !comment.trim())) {
    return res.status(400).json({ error: "Une justification est requise pour rejeter cette demande." });
  }

  const updatedRequest = await store.update("dueDateRequests", request.id, {
    status: approved ? "APPROUVEE" : "REJETEE",
    reviewedById: req.user.id,
    reviewComment: comment ? comment.trim() : null,
    reviewedAt: new Date().toISOString(),
  });

  if (approved) {
    await store.update("projects", project.id, { dueDate: request.proposedDueDate });
  }

  const updatedProject = await store.find("projects", (p) => p.id === project.id);
  res.json({ request: updatedRequest, project: await serializeProject(updatedProject) });
});

module.exports = router;