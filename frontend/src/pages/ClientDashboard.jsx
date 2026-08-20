import React, { useEffect, useState } from "react";
import api from "../api/client";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import ChatThread from "../components/ChatThread";
import ProjectAssets from "../components/ProjectAssets";

export default function ClientDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dueDateRequests, setDueDateRequests] = useState([]);
  const [showDueDateModal, setShowDueDateModal] = useState(false);

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

  async function loadDueDateRequests(projectId) {
    const { data } = await api.get(`/projects/${projectId}/due-date-requests`);
    setDueDateRequests(data);
  }

  useEffect(() => {
    if (selected) loadDueDateRequests(selected.id);
  }, [selected?.id]);

  const latestRequest = dueDateRequests[0];

  async function activateMaintenance() {
    await api.patch(`/projects/${selected.id}/maintenance`);
    load();
  }

  async function cancelMaintenance() {
    await api.patch(`/projects/${selected.id}/maintenance/cancel`);
    load();
  }

  if (loading) {
    return (
      <DashboardLayout title="Mes projets">
        <p className="text-navy-400 text-sm">Chargement...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Mes projets"
      subtitle={`Vous suivez actuellement ${projects.length} projet${projects.length > 1 ? "s" : ""} avec DevPioneers.`}
    >
      {projects.length === 0 ? (
        <p className="text-navy-400 text-sm">Aucun projet ne vous a encore été assigné.</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-[260px_1fr_300px]">
          <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden self-start lg:overflow-x-visible overflow-x-auto">
            <div className="px-4 pt-4 pb-3 border-b border-navy-100">
              <h4 className="text-[11.5px] uppercase tracking-wide text-navy-400 font-semibold">
                Mes projets ({projects.length})
              </h4>
            </div>
            <div className="flex lg:block overflow-x-auto lg:overflow-x-visible">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`text-left px-4 py-3.5 border-b lg:border-b border-navy-100 last:border-b-0 transition relative shrink-0 w-[220px] lg:w-full ${
                    selectedId === p.id ? "bg-navy-50" : "hover:bg-navy-50/60"
                  }`}
                >
                  {selectedId === p.id && (
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-violet-accent to-sky-accent" />
                  )}
                  <div className="text-[13px] font-semibold mb-1.5">{p.name}</div>
                  <StatusBadge status={p.status} />
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <>
              <div className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <h3 className="font-display font-semibold text-[15.5px]">{selected.name}</h3>
                    <p className="text-[11.5px] text-navy-400 mt-0.5">
                      Discussion avec {selected.developers.map((d) => d.name).join(", ") || "l'équipe"}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <ChatThread projectId={selected.id} canValidate={true} />
                <div className="mt-4">
                  <ProjectAssets projectId={selected.id} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {selected.status === "LIVRE" && !selected.maintenanceActive && (
                  <div className="rounded-2xl p-5 border border-violet-accent/30" style={{ background: "linear-gradient(160deg, rgba(108,99,255,0.12), rgba(157,123,255,0.03))" }}>
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center mb-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C63FF" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                    </div>
                    <h4 className="font-display font-semibold text-[15px] mb-2">Projet livré 🎉</h4>
                    <p className="text-[12.5px] text-navy-400 leading-relaxed">
                      Souhaitez-vous que DevPioneers gère la maintenance de ce projet (correctifs,
                      mises à jour, disponibilité) ?
                    </p>
                    <button
                      onClick={activateMaintenance}
                      className="mt-4 w-full py-2.5 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[13px] hover:opacity-90 transition"
                    >
                      Activer la maintenance
                    </button>
                  </div>
                )}

                {selected.maintenanceActive && (
                  <div className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50">
                    <div className="flex items-center gap-2 text-[12.5px] text-emerald-700 mb-3">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                      Maintenance active sur ce projet
                    </div>
                    <button
                      onClick={cancelMaintenance}
                      className="w-full py-2 rounded-lg border border-emerald-300 text-emerald-700 font-semibold text-[12.5px] hover:bg-emerald-100 transition"
                    >
                      Annuler la maintenance
                    </button>
                  </div>
                )}

                <div className="bg-white border border-navy-100 rounded-2xl p-5">
                  <h4 className="text-[12.5px] uppercase tracking-wide text-navy-400 font-semibold mb-3.5">
                    Détails du projet
                  </h4>
                  <Row k="Statut"><StatusBadge status={selected.status} /></Row>
                  <Row k="Développeurs">{selected.developers.map((d) => d.name).join(", ") || "—"}</Row>
                  <Row k="Créé le">{new Date(selected.createdAt).toLocaleDateString("fr-FR")}</Row>
                  {selected.dueDate && <Row k="Échéance">{new Date(selected.dueDate).toLocaleDateString("fr-FR")}</Row>}
                  {selected.deliveredAt && <Row k="Livré le">{new Date(selected.deliveredAt).toLocaleDateString("fr-FR")}</Row>}

                  {latestRequest?.status === "EN_ATTENTE" ? (
                    <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-[12px] font-semibold text-amber-700 mb-1">
                        Nouvelle échéance proposée : {new Date(latestRequest.proposedDueDate).toLocaleDateString("fr-FR")}
                      </div>
                      <p className="text-[11.5px] text-amber-600 leading-relaxed">En attente de validation par l'admin.</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDueDateModal(true)}
                      className="mt-3 w-full py-2 rounded-lg border border-navy-100 font-semibold text-[12.5px] hover:border-violet-accent transition"
                    >
                      Proposer une nouvelle échéance
                    </button>
                  )}

                  {latestRequest?.status === "REJETEE" && (
                    <div className="mt-2 p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <div className="text-[12px] font-semibold text-rose-700 mb-1">
                        Dernière demande refusée ({new Date(latestRequest.proposedDueDate).toLocaleDateString("fr-FR")})
                      </div>
                      {latestRequest.reviewComment && (
                        <p className="text-[11.5px] text-rose-600 leading-relaxed">{latestRequest.reviewComment}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showDueDateModal && selected && (
        <DueDateRequestModal
          project={selected}
          onClose={() => setShowDueDateModal(false)}
          onSubmitted={() => {
            setShowDueDateModal(false);
            loadDueDateRequests(selected.id);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function Row({ k, children }) {
  return (
    <div className="flex justify-between text-[13px] py-2 border-b border-navy-50 last:border-b-0">
      <span className="text-navy-400">{k}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function DueDateRequestModal({ project, onClose, onSubmitted }) {
  const [proposedDueDate, setProposedDueDate] = useState(
    project.dueDate ? project.dueDate.slice(0, 10) : ""
  );
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(`/projects/${project.id}/due-date-requests`, {
        proposedDueDate,
        justification,
      });
      onSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi de la demande.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-[440px] bg-white rounded-2xl p-7 shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-navy-400 hover:text-navy-900">✕</button>
        <h3 className="font-display font-bold text-[18px] mb-1">Proposer une nouvelle échéance</h3>
        <p className="text-navy-400 text-[13px] mb-5">
          Votre demande sera soumise à l'administrateur, qui pourra la valider ou la refuser.
        </p>
        {error && <div className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Nouvelle échéance</label>
            <input
              type="date"
              required
              value={proposedDueDate}
              onChange={(e) => setProposedDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm"
            />
          </div>
          <div>
            <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Justification</label>
            <textarea
              required
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Expliquez pourquoi vous demandez ce changement..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm min-h-[90px]"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Envoi..." : "Envoyer la demande"}
          </button>
        </form>
      </div>
    </div>
  );
}