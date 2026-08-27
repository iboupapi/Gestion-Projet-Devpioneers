/**
 * Couche de persistance — PostgreSQL via Prisma.
 *
 * Garde volontairement la même interface que l'ancienne version basée sur
 * data/db.json (all, find, filter, insert, update, remove) pour limiter les
 * changements dans les routes Express.
 *
 * DIFFÉRENCE IMPORTANTE : ces fonctions sont maintenant asynchrones (elles
 * renvoient des Promises). Chaque appel `store.xxx(...)` dans le reste du
 * code doit donc être précédé de `await` (et la fonction englobante doit
 * être `async` si ce n'est pas déjà le cas).
 *
 * find/filter chargent toute la table en mémoire puis appliquent le
 * prédicat JS, exactement comme avant — ce qui reste largement suffisant
 * pour le volume de données actuel. Si le volume grossit, remplacer les
 * appels les plus fréquents (ex: recherche par email au login) par un
 * `where` Prisma natif pour profiter des index.
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Nom de collection (comme avant : "users", "projects", ...) -> modèle Prisma
const MODEL = {
  users: "user",
  projects: "project",
  assignments: "assignment",
  messages: "message",
  attachments: "attachment",
  invitations: "invitation",
  projectAssets: "projectAsset",
  showcases: "showcase",
  dueDateRequests: "dueDateRequest",
};

function client(collection) {
  const key = MODEL[collection];
  if (!key || !prisma[key]) {
    throw new Error(`Collection inconnue : ${collection}`);
  }
  return prisma[key];
}

async function all(collection) {
  return client(collection).findMany();
}

async function find(collection, predicate) {
  const rows = await all(collection);
  return rows.find(predicate);
}

async function filter(collection, predicate) {
  const rows = await all(collection);
  return rows.filter(predicate);
}

async function findById(collection, id) {
  try {
    return await client(collection).findUnique({ where: { id } });
  } catch (err) {
    const rows = await all(collection);
    return rows.find((r) => r.id === id) || null;
  }
}

async function insert(collection, record) {
  return client(collection).create({ data: record });
}

async function update(collection, id, patch) {
  try {
    return await client(collection).update({ where: { id }, data: patch });
  } catch (err) {
    if (err.code === "P2025") return null; // enregistrement introuvable
    throw err;
  }
}

async function remove(collection, id) {
  try {
    await client(collection).delete({ where: { id } });
  } catch (err) {
    if (err.code !== "P2025") throw err; // déjà supprimé : on ignore
  }
}

module.exports = { all, find, findById, filter, insert, update, remove, prisma };