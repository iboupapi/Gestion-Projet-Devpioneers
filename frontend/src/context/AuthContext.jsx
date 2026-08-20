import React, { createContext, useContext, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("dp_user");
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("dp_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function acceptInvitation(token, password) {
    const { data } = await api.post(`/auth/invitations/${token}/accept`, { password });
    localStorage.setItem("dp_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("dp_user");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, acceptInvitation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}