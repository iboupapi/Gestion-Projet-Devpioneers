import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AcceptInvitation from "./pages/AcceptInvitation";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DevDashboard from "./pages/DevDashboard";
import Showcase from "./pages/Showcase";

const ROLE_ROUTE = { ADMIN: "/admin", DEVELOPER: "/dev", CLIENT: "/client" };

function ProtectedRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={ROLE_ROUTE[user.role]} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={ROLE_ROUTE[user.role]} replace /> : <Login />} />
      <Route path="/invitation/:token" element={<AcceptInvitation />} />
      <Route
        path="/client"
        element={
          <ProtectedRoute role="CLIENT">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dev"
        element={
          <ProtectedRoute role="DEVELOPER">
            <DevDashboard />
          </ProtectedRoute>
        }
      />
      {/* Accessible aux trois rôles — pas de prop "role" passée, donc ProtectedRoute
          ne filtre que sur l'authentification, pas sur le rôle précis. */}
      <Route
        path="/showcase"
        element={
          <ProtectedRoute>
            <Showcase />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? ROLE_ROUTE[user.role] : "/login"} replace />} />
    </Routes>
  );
}