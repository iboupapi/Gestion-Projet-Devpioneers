/**
 * Importe les données existantes de data/db.json vers PostgreSQL.
 * À lancer une seule fois, après `npx prisma migrate dev`.
 *
 * Usage : node scripts/migrate-json-to-pg.js
 */
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

async function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.log("Aucun data/db.json trouvé, rien à migrer.");
    return;
  }
  const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));

  for (const u of data.users || []) {
    await prisma.user.upsert({ where: { id: u.id }, update: {}, create: u });
  }
  for (const p of data.projects || []) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: p });
  }
  for (const a of data.assignments || []) {
    await prisma.assignment.upsert({ where: { id: a.id }, update: {}, create: a });
  }
  for (const m of data.messages || []) {
    await prisma.message.upsert({ where: { id: m.id }, update: {}, create: m });
  }
  for (const att of data.attachments || []) {
    await prisma.attachment.upsert({ where: { id: att.id }, update: {}, create: att });
  }
  for (const inv of data.invitations || []) {
    await prisma.invitation.upsert({ where: { id: inv.id }, update: {}, create: inv });
  }

  console.log("✅ Migration terminée.");
}

main()
  .catch((err) => {
    console.error("❌ Erreur pendant la migration :", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());