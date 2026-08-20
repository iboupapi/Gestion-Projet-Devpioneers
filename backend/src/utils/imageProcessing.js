const sharp = require("sharp");

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;

// Compresse un buffer d'image si besoin (redimensionne si trop large, recompresse).
// Les fichiers non-image (ou SVG) sont renvoyés tels quels.
// Renvoie { buffer, mimeType }.
async function processImageBuffer(buffer, mimetype) {
  if (!mimetype?.startsWith("image/") || mimetype === "image/svg+xml") {
    return { buffer, mimeType: mimetype };
  }
  try {
    let image = sharp(buffer).rotate(); // respecte l'orientation EXIF avant tout traitement
    const metadata = await image.metadata();
    if (metadata.width && metadata.width > MAX_WIDTH) {
      image = image.resize({ width: MAX_WIDTH });
    }

    if (mimetype === "image/png") {
      const output = await image.png({ quality: PNG_QUALITY, compressionLevel: 8 }).toBuffer();
      return { buffer: output, mimeType: "image/png" };
    }

    // jpeg, webp, heic, etc. → recompressés en jpeg pour un gain de poids homogène
    const output = await image.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
    return { buffer: output, mimeType: "image/jpeg" };
  } catch (err) {
    console.error("Erreur compression image, envoi du fichier original:", err.message);
    return { buffer, mimeType: mimetype };
  }
}

module.exports = { processImageBuffer };