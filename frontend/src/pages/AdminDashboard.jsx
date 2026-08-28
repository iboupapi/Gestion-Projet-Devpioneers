import React, { useEffect, useState } from "react";
import api from "../api/client";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";

const ROLE_LABEL = { ADMIN: "Admin", DEVELOPER: "Développeur", CLIENT: "Client" };

export default function AdminDashboard() {
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [clients, setClients] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [assigningProject, setAssigningProject] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [inviteLink, setInviteLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dueDateRequests, setDueDateRequests] = useState([]);
  const [reviewingRequest, setReviewingRequest] = useState(null);

  async function loadAll() {
    const [p, d, c, r] = await Promise.all([
      api.get("/projects"),
      api.get("/users?role=DEVELOPER"),
      api.get("/users?role=CLIENT"),
      api.get("/projects/due-date-requests/pending"),
    ]);
    setProjects(p.data);
    setDevelopers(d.data);
    setClients(c.data);
    setDueDateRequests(r.data);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const pendingClosures = projects.filter((p) => p.readyToClose);
  const allUsers = [...clients, ...developers].sort((a, b) => a.name.localeCompare(b.name));

  async function closeProject(id) {
    await api.patch(`/projects/${id}/close`);
    loadAll();
  }

  async function reviewDueDateRequest(request, approved, comment) {
    await api.patch(`/projects/${request.projectId}/due-date-requests/${request.id}`, { approved, comment });
    setReviewingRequest(null);
    loadAll();
  }

  async function toggleActive(user) {
    await api.patch(`/users/${user.id}`, { isActive: !user.isActive });
    loadAll();
  }

  async function handleDeleteUser(user) {
    try {
      await api.delete(`/users/${user.id}`);
      setDeletingUser(null);
      setDeleteError("");
      loadAll();
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Erreur lors de la suppression.");
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Vue d'ensemble">
        <p className="text-navy-400 text-sm">Chargement...</p>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: "Projets actifs", value: projects.filter((p) => p.status !== "TERMINE").length },
    { label: "Clients", value: clients.length },
    { label: "En révision / livraison", value: projects.filter((p) => ["EN_REVISION", "LIVRE"].includes(p.status)).length },
    { label: "Développeurs", value: developers.length },
  ];

  return (
    <DashboardLayout
      title="Vue d'ensemble"
      subtitle="Tous les projets, clients et développeurs de l'agence."
      actions={
        <div className="flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => setShowAdminModal(true)}
            className="px-3.5 py-2 rounded-lg border border-navy-100 text-[12.5px] font-semibold hover:border-violet-accent transition whitespace-nowrap"
          >
            + Créer un admin
          </button>
          <button
            onClick={() => setShowDeveloperModal(true)}
            className="px-3.5 py-2 rounded-lg border border-navy-100 text-[12.5px] font-semibold hover:border-violet-accent transition whitespace-nowrap"
          >
            + Ajouter un développeur
          </button>
          <button
            onClick={() => setShowClientModal(true)}
            className="px-3.5 py-2 rounded-lg border border-navy-100 text-[12.5px] font-semibold hover:border-violet-accent transition whitespace-nowrap"
          >
            + Inviter un client
          </button>
          <button
            onClick={() => setShowProjectModal(true)}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white text-[12.5px] font-semibold shadow-sm hover:opacity-90 transition whitespace-nowrap"
          >
            + Nouveau projet
          </button>
        </div>
      }
    >
      {pendingClosures.map((p) => (
        <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl px-5 py-4 mb-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <div>
              <div className="text-[13.5px] font-semibold">
                {p.developers.map((d) => d.name).join(", ")} a signalé « {p.name} » comme terminé
              </div>
              <div className="text-[12px] text-navy-400">En attente de votre validation — {p.client?.company || p.client?.name}</div>
            </div>
          </div>
          <button
            onClick={() => closeProject(p.id)}
            className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white text-[12.5px] font-semibold hover:opacity-90"
          >
            Valider la clôture
          </button>
        </div>
      ))}

      {dueDateRequests.map((r) => (
        <div key={r.id} className="rounded-2xl px-5 py-4 mb-4 border border-sky-200 bg-sky-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284C7" strokeWidth="2.2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="text-[13.5px] font-semibold">
                  {r.requestedBy?.name} propose une nouvelle échéance pour « {r.project?.name} »
                </div>
                <div className="text-[12px] text-navy-400">
                  Nouvelle date : {new Date(r.proposedDueDate).toLocaleDateString("fr-FR")} — {r.justification}
                </div>
              </div>
            </div>
            {reviewingRequest !== r.id && (
              <div className="flex gap-2 shrink-0 flex-wrap">
                <button
                  onClick={() => reviewDueDateRequest(r, true)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white text-[12.5px] font-semibold hover:opacity-90"
                >
                  Valider
                </button>
                <button
                  onClick={() => setReviewingRequest(r.id)}
                  className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 text-[12.5px] font-semibold hover:bg-rose-50"
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
          {reviewingRequest === r.id && (
            <RejectDueDateForm
              onCancel={() => setReviewingRequest(null)}
              onConfirm={(comment) => reviewDueDateRequest(r, false, comment)}
            />
          )}
        </div>
      ))}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-navy-100 rounded-2xl p-4 sm:p-5">
            <div className="text-[11px] sm:text-[11.5px] uppercase tracking-wide text-navy-400">{s.label}</div>
            <div className="font-display font-bold text-[22px] sm:text-[26px] mt-1.5">{s.value}</div>
          </div>
        ))}
      </div>

      <h3 className="text-[13px] uppercase tracking-wide text-navy-400 font-semibold mb-3">Projets</h3>
      <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[650px]">
            <thead>
              <tr className="bg-navy-900 text-white">
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Projet</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Client</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Développeurs</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Statut</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Échéance</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-navy-50 last:border-b-0">
                  <td className="px-5 py-4 text-[13.5px] font-semibold">{p.name}</td>
                  <td className="px-5 py-4 text-[13.5px]">{p.client?.company || p.client?.name}</td>
                  <td className="px-5 py-4 text-[13.5px]">{p.developers.map((d) => d.name).join(", ") || "—"}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4 text-[13px] font-mono text-navy-400">
                    {p.dueDate ? new Date(p.dueDate).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setAssigningProject(p)}
                      className="px-3 py-1.5 rounded-lg border border-navy-100 text-[12px] font-semibold hover:border-violet-accent transition"
                    >
                      Assigner
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h3 className="text-[13px] uppercase tracking-wide text-navy-400 font-semibold mb-3">
        Utilisateurs ({allUsers.length})
      </h3>
      <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-navy-900 text-white">
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Nom</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Email</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Rôle</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Entreprise</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold">Statut</th>
                <th className="px-5 py-3.5 text-[11px] uppercase tracking-wide font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-6 text-center text-navy-400 text-[13px]">
                    Aucun client ou développeur pour l'instant.
                  </td>
                </tr>
              )}
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b border-navy-50 last:border-b-0">
                  <td className="px-5 py-4 text-[13.5px] font-semibold">{u.name}</td>
                  <td className="px-5 py-4 text-[13px] text-navy-500">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full bg-navy-50 text-navy-600 border border-navy-100">
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-navy-500">{u.company || "—"}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-full border transition ${
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-navy-50 text-navy-400 border-navy-100 hover:bg-navy-100"
                      }`}
                      title="Cliquer pour changer le statut"
                    >
                      {u.isActive ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="px-3 py-1.5 rounded-lg border border-navy-100 text-[12px] font-semibold hover:border-violet-accent transition mr-2"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setDeletingUser(u);
                        setDeleteError("");
                      }}
                      className="px-3 py-1.5 rounded-lg border border-navy-100 text-[12px] font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showProjectModal && (
        <NewProjectModal
          clients={clients}
          developers={developers}
          onClose={() => setShowProjectModal(false)}
          onCreated={() => {
            setShowProjectModal(false);
            loadAll();
          }}
        />
      )}

      {showAdminModal && (
        <NewAdminModal
          onClose={() => {
            setShowAdminModal(false);
            setInviteLink(null);
          }}
          onCreated={(link) => {
            setInviteLink(link);
            loadAll();
          }}
          inviteLink={inviteLink}
        />
      )}

      {showClientModal && (
        <NewUserModal
          role="CLIENT"
          title="Inviter un client"
          subtitle="Un lien d'invitation sera généré pour qu'il définisse son mot de passe."
          onClose={() => {
            setShowClientModal(false);
            setInviteLink(null);
          }}
          onCreated={(link) => {
            setInviteLink(link);
            loadAll();
          }}
          inviteLink={inviteLink}
        />
      )}

      {showDeveloperModal && (
        <NewUserModal
          role="DEVELOPER"
          title="Ajouter un développeur"
          subtitle="Un lien d'invitation sera généré pour qu'il définisse son mot de passe."
          onClose={() => {
            setShowDeveloperModal(false);
            setInviteLink(null);
          }}
          onCreated={(link) => {
            setInviteLink(link);
            loadAll();
          }}
          inviteLink={inviteLink}
        />
      )}

      {assigningProject && (
        <AssignDevelopersModal
          project={assigningProject}
          developers={developers}
          onClose={() => setAssigningProject(null)}
          onSaved={() => {
            setAssigningProject(null);
            loadAll();
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            loadAll();
          }}
        />
      )}

      {deletingUser && (
        <Modal onClose={() => setDeletingUser(null)}>
          <h3 className="font-display font-bold text-[18px] mb-1">Supprimer {deletingUser.name} ?</h3>
          <p className="text-navy-400 text-[13px] mb-4">
            Cette action est définitive. Si ce compte a un historique lié (projets, messages,
            assignations, images), la suppression sera refusée — désactivez-le à la place dans ce cas.
          </p>
          {deleteError && (
            <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-relaxed">
              {deleteError}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleDeleteUser(deletingUser)}
              className="flex-1 py-2.5 rounded-lg bg-rose-600 text-white font-semibold text-[13.5px] hover:bg-rose-700 transition"
            >
              Supprimer définitivement
            </button>
            <button
              onClick={() => setDeletingUser(null)}
              className="flex-1 py-2.5 rounded-lg border border-navy-100 font-semibold text-[13.5px] hover:bg-navy-50 transition"
            >
              Annuler
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-[440px] bg-white rounded-2xl p-7 shadow-xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-navy-400 hover:text-navy-900">✕</button>
        {children}
      </div>
    </div>
  );
}

function NewProjectModal({ clients, developers, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [devIds, setDevIds] = useState([]);
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function toggleDev(id) {
    setDevIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post("/projects", { name, description, clientId, developerIds: devIds, dueDate: dueDate || null });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création.");
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-[18px] mb-1">Nouveau projet</h3>
      <p className="text-navy-400 text-[13px] mb-5">Créez un projet et assignez les développeurs.</p>
      {error && <div className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Nom du projet</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm focus:outline-none focus:border-violet-accent" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm focus:outline-none focus:border-violet-accent min-h-[70px]" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Client</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm">
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.company || c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Développeurs assignés</label>
          <div className="flex flex-wrap gap-2">
            {developers.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => toggleDev(d.id)}
                className={`px-3 py-1.5 rounded-full text-[12.5px] border transition ${
                  devIds.includes(d.id) ? "bg-navy-900 text-white border-navy-900" : "border-navy-100 text-navy-600"
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Échéance (optionnel)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90">
          Créer le projet
        </button>
      </form>
    </Modal>
  );
}

// Modal réutilisable pour créer un CLIENT ou un DEVELOPER — les deux passent
// désormais par une invitation (lien pour définir le mot de passe).
function NewUserModal({ role, title, subtitle, onClose, onCreated, inviteLink }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/users", { name, email, company: role === "CLIENT" ? company : undefined, role });
      onCreated(data.invitationLink);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création.");
    }
  }

  if (inviteLink) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display font-bold text-[18px] mb-1">
          {role === "CLIENT" ? "Client invité" : "Développeur invité"} ✅
        </h3>
        <p className="text-navy-400 text-[13px] mb-4">
          Envoyez ce lien par email pour qu'il/elle active son compte :
        </p>
        <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 text-[12px] font-mono break-all">
          {inviteLink}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-lg border border-navy-100 font-semibold text-[13.5px]">
          Fermer
        </button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-[18px] mb-1">{title}</h3>
      <p className="text-navy-400 text-[13px] mb-5">{subtitle}</p>
      {error && <div className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Nom</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        {role === "CLIENT" && (
          <div>
            <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Entreprise</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
          </div>
        )}
        <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90">
          Générer le lien d'invitation
        </button>
      </form>
    </Modal>
  );
}

// Modal pour modifier les développeurs assignés à un projet déjà créé.
// Réutilise PATCH /api/projects/:id/assign, déjà présent côté backend.
function AssignDevelopersModal({ project, developers, onClose, onSaved }) {
  const [devIds, setDevIds] = useState(project.developers.map((d) => d.id));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleDev(id) {
    setDevIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/projects/${project.id}/assign`, { developerIds: devIds });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement.");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-[18px] mb-1">Assigner des développeurs</h3>
      <p className="text-navy-400 text-[13px] mb-5">{project.name}</p>
      {error && <div className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {developers.map((d) => (
            <button
              type="button"
              key={d.id}
              onClick={() => toggleDev(d.id)}
              className={`px-3 py-1.5 rounded-full text-[12.5px] border transition ${
                devIds.includes(d.id) ? "bg-navy-900 text-white border-navy-900" : "border-navy-100 text-navy-600"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </Modal>
  );
}

// Modal pour créer un nouveau compte administrateur — même mécanisme d'invitation,
// mais route dédiée (POST /users/admins) et pas de champ entreprise.
function NewAdminModal({ onClose, onCreated, inviteLink }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/users/admins", { name, email });
      onCreated(data.invitationLink);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création.");
    }
  }

  if (inviteLink) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display font-bold text-[18px] mb-1">Admin créé ✅</h3>
        <p className="text-navy-400 text-[13px] mb-4">
          Envoyez ce lien par email pour qu'il/elle active son compte :
        </p>
        <div className="p-3 rounded-lg bg-navy-50 border border-navy-100 text-[12px] font-mono break-all">
          {inviteLink}
        </div>
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-lg border border-navy-100 font-semibold text-[13.5px]">
          Fermer
        </button>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-[18px] mb-1">Créer un admin</h3>
      <p className="text-navy-400 text-[13px] mb-5">
        Un lien d'invitation sera généré pour qu'il/elle définisse son propre mot de passe.
      </p>
      {error && <div className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Nom</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <button type="submit" className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90">
          Générer le lien d'invitation
        </button>
      </form>
    </Modal>
  );
}

// Modal pour modifier un utilisateur existant : nom, email, entreprise (client), rôle, statut.
function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [company, setCompany] = useState(user.company || "");
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/users/${user.id}`, {
        name,
        email,
        company: role === "CLIENT" ? company : null,
        role,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la modification.");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-[18px] mb-1">Modifier {user.name}</h3>
      <p className="text-navy-400 text-[13px] mb-5">Change le rôle uniquement si le compte n'a plus de données liées à son rôle actuel.</p>
      {error && (
        <div className="mb-4 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 leading-relaxed">
          {error}
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Nom</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Email</label>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Rôle</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm">
            <option value="CLIENT">Client</option>
            <option value="DEVELOPER">Développeur</option>
          </select>
        </div>
        {role === "CLIENT" && (
          <div>
            <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Entreprise</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </form>
    </Modal>
  );
}

// Formulaire inline pour justifier le refus d'une demande d'échéance —
// même principe que l'invalidation de maquette dans le chat.
function RejectDueDateForm({ onCancel, onConfirm }) {
  const [comment, setComment] = useState("");

  return (
    <div className="mt-3 flex flex-col gap-2">
      <textarea
        autoFocus
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Explique pourquoi cette échéance est refusée..."
        rows={2}
        className="text-[12.5px] border border-rose-200 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-400 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => comment.trim() && onConfirm(comment.trim())}
          disabled={!comment.trim()}
          className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-[12px] font-semibold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirmer le refus
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-navy-400 text-[12px] font-semibold hover:bg-navy-50"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}