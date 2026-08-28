import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";
import socket from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("dp_user");
    return raw ? JSON.parse(raw) : null;
  });

  // Reconnecte le socket si l'utilisateur est déjà authentifié au chargement de la page
  useEffect(() => {
    if (user && localStorage.getItem("dp_token")) {
      if (!socket.connected) {
        socket.connect();
      }
    }
  }, [user]);

  async function login(email, password, role) {
    const { data } = await api.post("/auth/login", {
      email,
      password,
      role,
    });

    if (data.requiresRoleSelection) {
      return data;
    }

    if (data.token) {
      localStorage.setItem("dp_token", data.token);
    }
    localStorage.setItem("dp_user", JSON.stringify(data.user));
    setUser(data.user);

    socket.connect();

    return data.user;
  }

  async function acceptInvitation(token, password) {
    const { data } = await api.post(
      `/auth/invitations/${token}/accept`,
      { password }
    );

    if (data.token) {
      localStorage.setItem("dp_token", data.token);
    }
    localStorage.setItem("dp_user", JSON.stringify(data.user));
    setUser(data.user);

    socket.connect();

    return data.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Erreur logout serveur:", err);
    } finally {
      socket.disconnect();

      localStorage.removeItem("dp_token");
      localStorage.removeItem("dp_user");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        acceptInvitation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}