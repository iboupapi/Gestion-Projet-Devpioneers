import { io } from "socket.io-client";

// L'URL du backend — en dev, le serveur Express/Socket.io tourne sur un port différent du frontend Vite,
// donc on ne peut pas passer par le même proxy relatif "/api". À adapter en prod via VITE_API_URL.
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const socket = io(SOCKET_URL, {
  withCredentials: true, // envoie le cookie httpOnly dp_token pour l'authentification
  autoConnect: true,
});

socket.on("connect", () => console.log("[socket] connecté —", socket.id));
socket.on("connect_error", (err) => console.error("[socket] erreur de connexion:", err.message));
socket.on("disconnect", (reason) => console.log("[socket] déconnecté —", reason));

export default socket;