const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Suppression de l'ancien index unique sur email si présent...");
  try {
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "User_email_key";`);
    console.log('✅ Ancien index unique "User_email_key" supprimé avec succès.');
  } catch (err) {
    console.log("Info/Avertissement:", err.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
