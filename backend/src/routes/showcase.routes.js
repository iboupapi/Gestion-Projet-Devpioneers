const express = require("express");
const multer = require("multer");
const path = require("path");
const store = require("../db/store");
const { requireAuth, requireRole } = require("../middleware/auth");
const { uuid } = require("../utils/auth");
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

function serializeShowcase(item) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    url: item.url,
    imageUrl: item.imageUrl,
    published: item.published,
    createdAt: item.createdAt,
  };
}

// GET /api/showcase — liste des réalisations.
// Les admins voient tout (y compris les brouillons non publiés) ; les autres rôles
// ne voient que les éléments publiés.
router.get("/", async (req, res) => {
  let items = await store.filter("showcases", () => true);
  if (req.user.role !== "ADMIN") {
    items = items.filter((i) => i.published);
  }
  items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items.map(serializeShowcase));
});

// POST /api/showcase — l'admin publie une nouvelle réalisation (image optionnelle)
router.post("/", requireRole("ADMIN"), upload.single("image"), async (req, res) => {
  const { title, description, type, url, published } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: "Titre et description sont requis." });
  }
  const validType = ["SAAS", "MOBILE_APP", "WEB", "AUTRE"].includes(type) ? type : "AUTRE";

  let imageUrl = null;
  let imageMime = null;
  let imageSize = null;
  if (req.file) {
    const saved = await saveUploadedFile(req.file, UPLOAD_DIR);
    imageUrl = saved.url;
    imageMime = saved.mimeType;
    imageSize = saved.size;
  }

  const item = await store.insert("showcases", {
    id: uuid(),
    title,
    description,
    type: validType,
    url: url || null,
    imageUrl,
    imageMime,
    imageSize,
    published: published === undefined ? true : published === true || published === "true",
    createdById: req.user.id,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(serializeShowcase(item));
});

// PATCH /api/showcase/:id — modifier une réalisation (titre, description, type, lien,
// image, statut publié/brouillon)
router.patch("/:id", requireRole("ADMIN"), upload.single("image"), async (req, res) => {
  const existing = await store.find("showcases", (i) => i.id === req.params.id);
  if (!existing) return res.status(404).json({ error: "Réalisation introuvable." });

  const { title, description, type, url, published } = req.body;
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (type !== undefined && ["SAAS", "MOBILE_APP", "WEB", "AUTRE"].includes(type)) updates.type = type;
  if (url !== undefined) updates.url = url || null;
  if (published !== undefined) updates.published = published === true || published === "true";

  if (req.file) {
    const saved = await saveUploadedFile(req.file, UPLOAD_DIR);
    updates.imageUrl = saved.url;
    updates.imageMime = saved.mimeType;
    updates.imageSize = saved.size;
  }

  const item = await store.update("showcases", req.params.id, updates);
  res.json(serializeShowcase(item));
});

// DELETE /api/showcase/:id
router.delete("/:id", requireRole("ADMIN"), async (req, res) => {
  const existing = await store.find("showcases", (i) => i.id === req.params.id);
  if (!existing) return res.status(404).json({ error: "Réalisation introuvable." });
  await store.remove("showcases", req.params.id);
  res.status(204).send();
});

module.exports = router;