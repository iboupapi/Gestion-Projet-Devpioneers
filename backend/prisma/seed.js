/**
 * Crée le compte admin initial dans PostgreSQL (via Prisma).
 * L'admin peut ensuite créer les comptes client, développeur et autres admins
 * directement depuis l'application.
 *
 * Usage : node prisma/seed.js
 *
 * En développement, sans rien configurer, utilise les valeurs par défaut ci-dessous.
 * En production, définis ADMIN_EMAIL / ADMIN_NAME / ADMIN_PASSWORD dans l'environnement
 * avant de lancer ce script, pour ne pas dépendre d'un mot de passe codé en dur dans le repo.
 */
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_EMAIL = "admin@devpioneers.sn";
const DEFAULT_NAME = "Awa Diop";
const DEFAULT_PASSWORD = "devpioneers2026";

async function main() {
  const email = process.env.ADMIN_EMAIL || DEFAULT_EMAIL;
  const name = process.env.ADMIN_NAME || DEFAULT_NAME;
  const usingDefaultPassword = !process.env.ADMIN_PASSWORD;
  const rawPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const password = await bcrypt.hash(rawPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Compte admin prêt :");
  console.log(`   Email        : ${admin.email}`);
  if (usingDefaultPassword) {
    console.log(`   Mot de passe : ${DEFAULT_PASSWORD} (valeur par défaut)`);
    console.log("   ⚠️  En production, définis ADMIN_PASSWORD (et idéalement ADMIN_EMAIL) avant de lancer ce script.");
  } else {
    console.log("   Mot de passe : celui défini via la variable ADMIN_PASSWORD.");
  }
}

main()
  .catch((err) => {
    console.error("❌ Erreur pendant le seed :", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());