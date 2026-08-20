import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import Logo from "../components/Logo";

function EyeIcon({ visible }) {
  return visible ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { acceptInvitation } = useAuth();
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/auth/invitations/${token}`)
      .then(({ data }) => setInvite(data))
      .catch((err) => setError(err.response?.data?.error || "Lien invalide."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) return setError("Les mots de passe ne correspondent pas.");
    try {
      const user = await acceptInvitation(token, password);
      navigate(user.role === "CLIENT" ? "/client" : "/login");
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 px-4 py-10">
      <div className="w-full max-w-[400px] p-7 sm:p-9 bg-white rounded-2xl border border-navy-100 shadow-sm">
        <div className="mb-6"><Logo /></div>

        {loading && <p className="text-navy-400 text-sm">Vérification du lien...</p>}

        {!loading && error && !invite && (
          <div className="text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {invite && (
          <>
            <h2 className="font-display text-xl font-bold mb-1">Bienvenue, {invite.name.split(" ")[0]} 👋</h2>
            <p className="text-navy-400 text-[13px] mb-6">
              Définissez votre mot de passe pour activer votre accès à votre espace client.
            </p>
            {error && (
              <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-3 pr-11 rounded-lg border border-navy-100 text-sm focus:outline-none focus:border-violet-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600 transition"
                    tabIndex={-1}
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full px-3.5 py-3 pr-11 rounded-lg border border-navy-100 text-sm focus:outline-none focus:border-violet-accent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600 transition"
                    tabIndex={-1}
                    title={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    <EyeIcon visible={showConfirm} />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] shadow-md hover:opacity-90 transition"
              >
                Activer mon compte
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}