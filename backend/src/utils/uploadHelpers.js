const path = require("path");
const fs = require("fs/promises");
const { uuid } = require("./auth");
const { processImageBuffer } = require("./imageProcessing");

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Prend un fichier multer (en mémoire, via multer.memoryStorage()), le compresse si c'est une
// image, l'écrit sur disque, et renvoie les infos à stocker en base.
async function saveUploadedFile(file, uploadDir) {
  const { buffer, mimeType } = await processImageBuffer(file.buffer, file.mimetype);
  const ext = EXT_BY_MIME[mimeType] || path.extname(file.originalname) || "";
  const filename = `${Date.now()}-${uuid()}${ext}`;
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return {
    filename,
    url: `/uploads/${filename}`,
    mimeType,
    size: buffer.length,
  };
}

module.exports = { saveUploadedFile };