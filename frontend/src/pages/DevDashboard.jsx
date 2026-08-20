import React, { useEffect, useState } from "react";
import api from "../api/client";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import ChatThread from "../components/ChatThread";
import ProjectAssets from "../components/ProjectAssets";

export default function DevDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await api.get("/projects");
    setProjects(data);
    if (!selectedId && data.length) setSelectedId(data[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const selected = projects.find((p) => p.id === selectedId);

  async function signalReady() {
    await api.patch(`/projects/${selected.id}/signal-ready`);
    load();
  }

  async function markDelivered() {
    await api.patch(`/projects/${selected.id}/status`, { status: "LIVRE" });
    load();
  }

  async function setStatus(status) {
    await api.patch(`/projects/${selected.id}/status`, { status });
    load();
  }

  if (loading) {
    return (
      <DashboardLayout title="Mes projets assignés">
        <p className="text-navy-400 text-sm">Chargement...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Mes projets assignés"
      subtitle={`${projects.length} projet${projects.length > 1 ? "s" : ""} assigné${projects.length > 1 ? "s" : ""}.`}
    >
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[280px_1fr]">
        <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`text-left bg-white border rounded-2xl p-4 transition shrink-0 w-[240px] lg:w-full ${
                selectedId === p.id ? "border-violet-accent shadow-sm" : "border-navy-100 hover:border-violet-accent/40"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <StatusBadge status={p.status} />
                {p.readyToClose && <span className="text-[10px] font-mono text-amber-600">à clôturer</span>}
              </div>
              <div className="font-semibold text-[14px] mb-1">{p.name}</div>
              <div className="text-[11.5px] text-navy-400">{p.client?.company || p.client?.name}</div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-display font-semibold text-[15.5px]">{selected.name}</h3>
                <p className="text-[11.5px] text-navy-400 mt-0.5">
                  {selected.client?.company || selected.client?.name} · co-assigné avec{" "}
                  {selected.developers.map((d) => d.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selected.status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-[12.5px] border border-navy-100 rounded-lg px-2.5 py-1.5"
                >
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="EN_REVISION">En révision</option>
                  <option value="LIVRE">Livré</option>
                </select>
                {selected.status !== "TERMINE" && !selected.readyToClose && (
                  <button
                    onClick={signalReady}
                    className="text-[12.5px] font-semibold border border-navy-100 rounded-lg px-3 py-1.5 hover:border-emerald-300 hover:text-emerald-600 transition"
                    title="Seul l'admin peut clôturer le projet"
                  >
                    Signaler comme terminé
                  </button>
                )}
                {selected.readyToClose && (
                  <span className="text-[12px] text-amber-600 font-medium">En attente de clôture admin</span>
                )}
              </div>
            </div>
            <ChatThread projectId={selected.id} canValidate={false} />
            <p className="text-[11.5px] text-navy-400 mt-3">
              Envoyez une maquette avec l'icône image dans le chat, ou un lien de test avec l'icône lien.
              Signaler un projet notifie l'admin, qui valide et clôture le projet.
            </p>
            <div className="mt-4">
              <ProjectAssets projectId={selected.id} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}