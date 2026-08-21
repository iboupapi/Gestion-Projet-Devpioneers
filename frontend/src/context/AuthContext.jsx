import React, { createContext, useContext, useState } from "react";
import api from "../api/client";
import socket from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("dp_user");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    localStorage.setItem("dp_user", JSON.stringify(data.user));
    setUser(data.user);

    // Maintenant que le cookie dp_token a été créé,
    // on peut connecter Socket.IO.
    socket.connect();

    return data.user;
  }

  async function acceptInvitation(token, password) {
    const { data } = await api.post(
      `/auth/invitations/${token}/accept`,
      { password }
    );

    localStorage.setItem("dp_user", JSON.stringify(data.user));
    setUser(data.user);

    // Le backend crée également dp_token après
    // l'acceptation de l'invitation.
    socket.connect();

    return data.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      // Déconnecte Socket.IO avant de supprimer
      // les informations locales de l'utilisateur.
      socket.disconnect();

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