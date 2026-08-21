import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false,
});

socket.on("connect", () => {
  console.log("[socket] connecté —", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("[socket] erreur de connexion:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("[socket] déconnecté —", reason);
});

export default socket;