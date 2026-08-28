import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectAccounts, setSelectAccounts] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password, role);
      if (result.requiresRoleSelection) {
        setSelectAccounts(result.accounts);
        setLoading(false);
        return;
      }
      const user = result;
      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "DEVELOPER") navigate("/dev");
      else navigate("/client");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function selectAccountRole(chosenRole) {
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password, chosenRole);
      if (user.role === "ADMIN") navigate("/admin");
      else if (user.role === "DEVELOPER") navigate("/dev");
      else navigate("/client");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion.");
    } finally {
      setLoading(false);
      setSelectAccounts(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-[1.1] p-8 sm:p-12 lg:p-16 flex flex-col justify-center relative overflow-hidden bg-navy-900">
        <div
          className="absolute w-[500px] h-[500px] rounded-full -top-40 -left-40 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(108,99,255,0.25), transparent 65%)" }}
        />
        <div className="relative">
          <div className="mb-8">
            <Logo />
          </div>
          <div className="flex items-center gap-2.5 mb-5 text-sky-accent font-mono text-xs uppercase tracking-[2px]">
            <span className="w-5 h-px bg-sky-accent" /> Portail Client DevPioneers
          </div>
          <h1 className="font-display text-white text-[30px] sm:text-[36px] lg:text-[42px] font-bold leading-tight max-w-lg">
            Suivez votre projet.
            <br />
            <span className="bg-gradient-to-r from-sky-accent to-violet-accent bg-clip-text text-transparent">
              Parlez à votre équipe.
            </span>
          </h1>
          <p className="text-navy-100 text-[15px] mt-5 max-w-md leading-relaxed">
            Un espace privé pour suivre l'avancement de vos développements, valider vos
            maquettes et échanger directement avec les développeurs assignés à votre projet.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white px-4 py-10 lg:py-0">
        <div className="w-full max-w-[380px] p-7 sm:p-9 rounded-2xl border border-navy-100 shadow-sm">
          {selectAccounts ? (
            <div>
              <h2 className="font-display text-xl font-bold mb-1">Choisir un compte</h2>
              <p className="text-navy-400 text-[13px] mb-5">
                Plusieurs comptes sont associés à cet email. Sélectionnez celui auquel vous souhaitez vous connecter :
              </p>
              {error && (
                <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="space-y-2.5">
                {selectAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => selectAccountRole(acc.role)}
                    className="w-full text-left p-3.5 rounded-xl border border-navy-100 hover:border-violet-accent hover:bg-navy-50/50 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[13.5px] font-semibold">{acc.name}</div>
                      <div className="text-[12px] text-navy-400">
                        {acc.role === "ADMIN" ? "Administrateur" : acc.role === "DEVELOPER" ? "Développeur" : "Client"}
                        {acc.company ? ` · ${acc.company}` : ""}
                      </div>
                    </div>
                    <span className="text-violet-accent font-semibold text-[13px]">Sélectionner →</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSelectAccounts(null)}
                className="mt-5 w-full text-center text-[12.5px] text-navy-400 hover:text-navy-700 underline"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="font-display text-xl font-bold mb-1">Connexion</h2>
              <p className="text-navy-400 text-[13px] mb-6">Accédez à votre espace de suivi de projet.</p>

              {error && (
                <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Adresse email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.sn"
                  className="w-full px-3.5 py-3 rounded-lg border border-navy-100 text-sm focus:outline-none focus:border-violet-accent"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Type de compte (optionnel)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm bg-white focus:outline-none focus:border-violet-accent"
                >
                  <option value="">Automatique</option>
                  <option value="ADMIN">Administrateur</option>
                  <option value="DEVELOPER">Développeur</option>
                  <option value="CLIENT">Client</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] shadow-md hover:opacity-90 transition disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Accéder à mon espace"}
              </button>

              <div className="mt-5 p-3.5 rounded-lg bg-sky-50 border border-sky-100 text-[12px] text-navy-400 leading-relaxed">
                <b className="text-sky-700">Première connexion ?</b> Utilisez le lien d'invitation reçu par
                email pour définir votre mot de passe.
              </div>

              <div className="mt-5 text-center text-[11.5px] text-navy-400">
                Démo : <Link to="/invitation/demo" className="underline">définir un mot de passe via invitation</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}