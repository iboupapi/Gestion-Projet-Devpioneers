import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL = { ADMIN: "Admin", DEVELOPER: "Développeur", CLIENT: "Client" };

const DASHBOARD_PATH = { ADMIN: "/admin", DEVELOPER: "/dev", CLIENT: "/client" };
const DASHBOARD_LABEL = { ADMIN: "Tableau de bord", DEVELOPER: "Mes projets", CLIENT: "Mes projets" };

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function ShowcaseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z" />
    </svg>
  );
}

export default function DashboardLayout({ children, title, subtitle, actions }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { label: DASHBOARD_LABEL[user.role], path: DASHBOARD_PATH[user.role], icon: DashboardIcon },
    { label: "Nos réalisations", path: "/showcase", icon: ShowcaseIcon },
  ];

  // Ferme le tiroir automatiquement si l'écran repasse en desktop, et empêche le scroll
  // du fond pendant qu'il est ouvert sur mobile — deux petits détails qui évitent les
  // états "coincés" (tiroir resté ouvert après un resize, page qui scrolle derrière).
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const sidebarContent = (
    <>
      <div className="pb-5 mb-4 border-b border-navy-100">
        <Logo />
      </div>

      <div className="text-[10.5px] uppercase tracking-wide text-navy-300 font-semibold px-2.5 mb-2">
        {ROLE_LABEL[user.role]}
      </div>

      <nav className="space-y-1 mb-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-150 ${
                active ? "bg-navy-50 text-navy-700" : "text-navy-400 hover:bg-navy-50 hover:text-navy-600"
              }`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <button
        onClick={logout}
        className="mt-auto flex items-center gap-2.5 p-2.5 rounded-lg border-t border-navy-100 pt-4 hover:bg-navy-50 transition-colors duration-150 text-left group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent flex items-center justify-center text-white font-display font-bold text-[12px] shrink-0">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate">{user.name}</div>
          <div className="text-[11px] text-navy-400 truncate group-hover:text-navy-600 transition-colors">
            Se déconnecter{user.company ? ` · ${user.company}` : ""}
          </div>
        </div>
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-navy-50">
      {/* Sidebar desktop — fixe et toujours visible à partir de lg */}
      <aside className="hidden lg:flex w-60 bg-white border-r border-navy-100 flex-col p-4 shrink-0">
        {sidebarContent}
      </aside>

      {/* Fond assombri — toujours monté, fondu en opacité pour une fermeture propre */}
      <div
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Tiroir mobile — toujours monté, glisse depuis la gauche via transform */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 z-50 bg-white flex flex-col p-4 shadow-2xl lg:hidden transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-navy-300 hover:text-navy-600 hover:bg-navy-50 transition-colors"
          title="Fermer le menu"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-9 overflow-y-auto min-w-0">
        {/* Barre mobile avec bouton hamburger */}
        <div className="flex items-center gap-3 mb-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg border border-navy-100 flex items-center justify-center text-navy-600 hover:bg-navy-50 hover:border-navy-200 transition-colors shrink-0"
            title="Ouvrir le menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Logo />
        </div>

        <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-navy-900">{title}</h1>
            {subtitle && <p className="text-navy-400 text-[13.5px] mt-1">{subtitle}</p>}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}