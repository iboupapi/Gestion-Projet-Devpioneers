const express = require("express");
const multer = require("multer");
const path = require("path");
const store = require("../db/store");
const { requireAuth } = require("../middleware/auth");
const { uuid } = require("../utils/auth");
const { canAccessProject } = require("../utils/projectAccess");
const { saveUploadedFile } = require("../utils/uploadHelpers");

const router = express.Router();
router.use(requireAuth);

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Seules les images sont acceptées."));
    }
    cb(null, true);
  },
});

function serializeAsset(asset) {
  return {
    id: asset.id,
    filename: asset.filename,
    url: asset.url,
    mimeType: asset.mimeType,
    size: asset.size,
    createdAt: asset.createdAt,
    uploadedBy: asset.uploadedBy
      ? { id: asset.uploadedBy.id, name: asset.uploadedBy.name, role: asset.uploadedBy.role }
      : undefined,
    uploadedById: asset.uploadedById,
  };
}

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

// GET /api/projects/:projectId/assets — liste des images du projet
router.get("/:projectId/assets", async (req, res) => {
  const project = await loadProjectOr403(req, res);
  if (!project) return;
  const assets = (await store.filter("projectAssets", (a) => a.projectId === project.id)).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(assets.map(serializeAsset));
});

// POST /api/projects/:projectId/assets — le client (ou l'admin) ajoute une image au projet
router.post("/:projectId/assets", upload.single("file"), async (req, res) => {
  const project = await loadProjectOr403(req, res);
  if (!project) return;
  if (!["CLIENT", "ADMIN"].includes(req.user.role)) {
    return res.status(403).json({ error: "Seul le client peut ajouter des images au projet." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "Aucune image envoyée." });
  }

  const saved = await saveUploadedFile(req.file, UPLOAD_DIR);
  const asset = await store.insert("projectAssets", {
    id: uuid(),
    projectId: project.id,
    uploadedById: req.user.id,
    filename: req.file.originalname,
    url: saved.url,
    mimeType: saved.mimeType,
    size: saved.size,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(serializeAsset(asset));
});

// DELETE /api/projects/:projectId/assets/:assetId — le propriétaire de l'image ou l'admin peut la retirer
router.delete("/:projectId/assets/:assetId", async (req, res) => {
  const project = await loadProjectOr403(req, res);
  if (!project) return;
  const asset = await store.find(
    "projectAssets",
    (a) => a.id === req.params.assetId && a.projectId === project.id
  );
  if (!asset) {
    return res.status(404).json({ error: "Image introuvable." });
  }
  if (asset.uploadedById !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Vous ne pouvez retirer que vos propres images." });
  }
  await store.remove("projectAssets", asset.id);
  res.status(204).send();
});

module.exports = router;