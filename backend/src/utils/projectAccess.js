const store = require("../db/store");

/** Un utilisateur a-t-il le droit de voir ce projet ? */
async function canAccessProject(user, project) {
  if (user.role === "ADMIN") return true;
  if (user.role === "CLIENT") return project.clientId === user.id;
  if (user.role === "DEVELOPER") {
    const assignments = await store.filter(
      "assignments",
      (a) => a.projectId === project.id && a.developerId === user.id
    );
    return assignments.length > 0;
  }
  return false;
}

/** Sérialise un projet avec ses développeurs, client, et métriques de messagerie */
async function serializeProject(project) {
  const assignments = await store.filter("assignments", (a) => a.projectId === project.id);
  const developers = (
    await Promise.all(assignments.map((a) => store.find("users", (u) => u.id === a.developerId)))
  )
    .filter(Boolean)
    .map((d) => ({ id: d.id, name: d.name, email: d.email }));

  const client = await store.find("users", (u) => u.id === project.clientId);
  const messages = await store.filter("messages", (m) => m.projectId === project.id);

  return {
    ...project,
    client: client ? { id: client.id, name: client.name, email: client.email, company: client.company } : null,
    developers,
    messageCount: messages.length,
    lastMessageAt: messages.length ? messages[messages.length - 1].createdAt : null,
  };
}

async function serializeMessage(message) {
  const author = await store.find("users", (u) => u.id === message.authorId);
  const attachments = await store.filter("attachments", (a) => a.messageId === message.id);
  return {
    ...message,
    author: author ? { id: author.id, name: author.name, role: author.role } : null,
    attachments,
  };
}

module.exports = { canAccessProject, serializeProject, serializeMessage };