require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const { parse: parseCookie } = require("cookie");

// Extrait la valeur d'un cookie donné depuis l'en-tête brut "cookie" — évite de dépendre
// du package "cookie" externe dont l'interop CJS/ESM pose problème selon les versions.
function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  const target = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!target) return null;
  try {
    return decodeURIComponent(target.slice(name.length + 1));
  } catch {
    return target.slice(name.length + 1);
  }
}
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const projectsRoutes = require("./routes/projects.routes");
const messagesRoutes = require("./routes/messages.routes");
const assetsRoutes = require("./routes/assets.routes");
const showcaseRoutes = require("./routes/showcase.routes");
const { verifyToken } = require("./utils/auth");
const { canAccessProject } = require("./utils/projectAccess");
const store = require("./db/store");

const app = express();

const FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim());

app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_URLS,
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/projects", projectsRoutes);
// messages routes are nested under /api/projects/:projectId/messages
app.use("/api/projects", messagesRoutes);
app.use("/api/projects", assetsRoutes);
app.use("/api/showcase", showcaseRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur serveur." });
});

// Serveur HTTP explicite : nécessaire pour brancher Socket.io sur le même port qu'Express
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URLS,
    credentials: true,
  },
});

// Authentifie chaque connexion websocket avec le même cookie httpOnly que les requêtes HTTP classiques
io.use(async (socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie || "";
    console.log("[socket auth] cookie reçu:", rawCookie || "(aucun cookie)");
    const token = getCookieValue(rawCookie, "dp_token");
    console.log("[socket auth] token dp_token présent:", token ? "oui" : "non");
    if (!token) return next(new Error("Authentification requise."));
    const payload = verifyToken(token);
    const user = await store.find("users", (u) => u.id === payload.sub);
    if (!user || !user.isActive) return next(new Error("Compte introuvable ou désactivé."));
    socket.data.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    console.error("[socket auth] erreur détaillée:", err.message);
    next(new Error("Session invalide ou expirée."));
  }
});

io.on("connection", (socket) => {
  // Le client rejoint une "room" par projet — seuls les membres du projet peuvent la rejoindre
  socket.on("join_project", async (projectId) => {
    try {
      const project = await store.find("projects", (p) => p.id === projectId);
      if (project && (await canAccessProject(socket.data.user, project))) {
        socket.join(`project:${projectId}`);
      }
    } catch (err) {
      console.error("Erreur join_project:", err.message);
    }
  });

  socket.on("leave_project", (projectId) => {
    socket.leave(`project:${projectId}`);
  });
});

// Rend "io" accessible depuis les routes via req.app.get("io")
app.set("io", io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✅ DevPioneers API en écoute sur http://localhost:${PORT}`);
});