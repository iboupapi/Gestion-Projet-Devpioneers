const express = require("express");
const multer = require("multer");
const path = require("path");
const store = require("../db/store");
const { requireAuth } = require("../middleware/auth");
const { uuid } = require("../utils/auth");
const { canAccessProject, serializeMessage, serializeProject } = require("../utils/projectAccess");
const { sendMail, newMessageEmail } = require("../utils/mailer");
const { saveUploadedFile } = require("../utils/uploadHelpers");

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo, cf. cahier des charges

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } });

async function loadProjectOr403(req, res) {
  const project = await store.find("projects", (p) => p.id === req.params.projectId);
  if (!project) {
    res.status(404).json({ error: "Projet introuvable." });
    return null;
  }
  if (!(await canAccessProject(req.user, project))) {
    res.status(403).json({ error: "Vous n'avez pas accès à ce projet." });
    return null;
  }
  return project;
}

// GET /api/projects/:projectId/messages
router.get("/:projectId/messages", async (req, res) => {
  const project = await loadProjectOr403(req, res);
  if (!project) return;
  const rawMessages = (await store.filter("messages", (m) => m.projectId === project.id)).sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  const messages = await Promise.all(rawMessages.map(serializeMessage));
  res.json(messages);
});

// POST /api/projects/:projectId/messages — envoyer un message (texte/lien, avec pièce jointe optionnelle),
// avec la possibilité de le marquer comme maquette (isMockup) quel que soit son format,
// et de préciser le type de lien (linkKind) si ce n'est pas une maquette
router.post("/:projectId/messages", upload.single("file"), async (req, res) => {
  const project = await loadProjectOr403(req, res);
  if (!project) return;

  const { content, type, linkUrl, linkKind } = req.body;
  if (!content && !req.file && !linkUrl) {
    return res.status(400).json({ error: "Le message est vide." });
  }

  const messageType = ["TEXTE", "LIEN"].includes(type) ? type : "TEXTE";
  const isMockup = req.body.isMockup === true || req.body.isMockup === "true";
  const validLinkKind = ["TEST", "FINAL"].includes(linkKind) ? linkKind : null;

  const message = await store.insert("messages", {
    id: uuid(),
    projectId: project.id,
    authorId: req.user.id,
    type: messageType,
    isMockup,
    content: content || "",
    linkUrl: messageType === "LIEN" ? linkUrl || null : null,
    linkKind: messageType === "LIEN" && !isMockup ? validLinkKind : null,
    validated: isMockup ? null : undefined, // en attente uniquement si c'est une maquette
    validatedAt: null,
    validationComment: null,
    createdAt: new Date().toISOString(),
  });

  if (req.file) {
    const saved = await saveUploadedFile(req.file, UPLOAD_DIR);
    await store.insert("attachments", {
      id: uuid(),
      messageId: message.id,
      filename: req.file.originalname,
      url: saved.url,
      mimeType: saved.mimeType,
      size: saved.size,
      createdAt: new Date().toISOString(),
    });
  }

  const serialized = await serializeMessage(message);
  res.status(201).json(serialized);

  // Diffuse le message en temps réel à tous les membres connectés du projet
  req.app.get("io")?.to(`project:${project.id}`).emit("new_message", { projectId: project.id, message: serialized });

  // Notifie l'autre partie par email (fire-and-forget, ne doit jamais bloquer/faire échouer la requête)
  notifyNewMessage(project, req.user, message).catch((err) =>
    console.error("Erreur notification email:", err.message)
  );
});

async function notifyNewMessage(project, author, message) {
  const fullProject = await serializeProject(project);
  const recipients =
    author.role === "CLIENT" ? fullProject.developers || [] : [fullProject.client].filter(Boolean);

  const preview =
    message.content?.trim() ||
    (message.linkUrl ? `Lien partagé : ${message.linkUrl}` : "Pièce jointe envoyée.");

  for (const recipient of recipients) {
    if (!recipient?.email) continue;
    const { subject, html } = newMessageEmail({
      recipientName: recipient.name,
      projectName: project.name,
      authorName: author.name,
      preview,
    });
    await sendMail({ to: recipient.email, subject, html });
  }
}

// PATCH /api/projects/:projectId/messages/:messageId/validate — le client valide ou invalide une maquette
// body: { approved: boolean, comment?: string } — comment obligatoire si approved === false
router.patch("/:projectId/messages/:messageId/validate", async (req, res) => {
  const project = await loadProjectOr403(req, res);
  if (!project) return;
  if (req.user.role !== "CLIENT") {
    return res.status(403).json({ error: "Seul le client peut valider une maquette." });
  }
  const { approved, comment } = req.body;
  if (typeof approved !== "boolean") {
    return res.status(400).json({ error: "Le champ 'approved' (true/false) est requis." });
  }
  if (approved === false && (!comment || !comment.trim())) {
    return res.status(400).json({ error: "Une justification est requise pour invalider une maquette." });
  }
  const message = await store.find(
    "messages",
    (m) => m.id === req.params.messageId && m.projectId === project.id
  );
  if (!message || !message.isMockup) {
    return res.status(404).json({ error: "Maquette introuvable." });
  }
  const updated = await store.update("messages", message.id, {
    validated: approved,
    validatedAt: new Date().toISOString(),
    validationComment: comment ? comment.trim() : null,
  });
  const serialized = await serializeMessage(updated);
  res.json(serialized);

  req.app.get("io")?.to(`project:${project.id}`).emit("message_updated", { projectId: project.id, message: serialized });
});

module.exports = router;