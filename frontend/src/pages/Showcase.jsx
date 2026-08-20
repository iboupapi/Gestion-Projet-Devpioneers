import React, { useEffect, useState } from "react";
import api from "../api/client";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";

const TYPE_LABEL = { SAAS: "SaaS", MOBILE_APP: "App mobile", WEB: "Site web", AUTRE: "Autre" };
const TYPE_COLOR = {
  SAAS: "bg-violet-50 text-violet-700 border-violet-200",
  MOBILE_APP: "bg-sky-50 text-sky-700 border-sky-200",
  WEB: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AUTRE: "bg-navy-50 text-navy-600 border-navy-100",
};

export default function Showcase() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  async function load() {
    const { data } = await api.get("/showcase");
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(item) {
    await api.delete(`/showcase/${item.id}`);
    setDeletingItem(null);
    load();
  }

  async function togglePublished(item) {
    await api.patch(`/showcase/${item.id}`, { published: !item.published });
    load();
  }

  if (loading) {
    return (
      <DashboardLayout title="Nos réalisations">
        <p className="text-navy-400 text-sm">Chargement...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Nos réalisations"
      subtitle="SaaS, applications mobiles et sites web développés par DevPioneers."
      actions={
        user.role === "ADMIN" && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white text-[13px] font-semibold shadow-sm hover:opacity-90 transition"
          >
            + Ajouter une réalisation
          </button>
        )
      }
    >
      {items.length === 0 && (
        <div className="border border-dashed border-navy-100 rounded-2xl py-16 text-center">
          <p className="text-navy-400 text-[13.5px]">
            {user.role === "ADMIN" ? "Aucune réalisation publiée pour l'instant." : "Rien à afficher pour l'instant."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`bg-white border rounded-2xl overflow-hidden flex flex-col ${
              item.published ? "border-navy-100" : "border-amber-200"
            }`}
          >
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c7cede" strokeWidth="1.6">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </div>
            )}
            <div className="p-4 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[item.type]}`}>
                  {TYPE_LABEL[item.type]}
                </span>
                {!item.published && (
                  <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                    Brouillon
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-[15px] mb-1.5">{item.title}</h3>
              <p className="text-navy-400 text-[12.5px] leading-relaxed flex-1">{item.description}</p>

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 text-[12.5px] font-semibold text-violet-accent hover:underline inline-flex items-center gap-1"
                >
                  Découvrir
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M7 17L17 7M7 7h10v10" />
                  </svg>
                </a>
              )}

              {user.role === "ADMIN" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-navy-50">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-navy-100 text-[11.5px] font-semibold hover:border-violet-accent transition"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => togglePublished(item)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-navy-100 text-[11.5px] font-semibold hover:border-navy-300 transition"
                  >
                    {item.published ? "Dépublier" : "Publier"}
                  </button>
                  <button
                    onClick={() => setDeletingItem(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-navy-100 text-[11.5px] font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
                  >
                    Suppr.
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(showForm || editingItem) && (
        <ShowcaseFormModal
          item={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingItem(null);
            load();
          }}
        />
      )}

      {deletingItem && (
        <Modal onClose={() => setDeletingItem(null)}>
          <h3 className="font-display font-bold text-[18px] mb-1">Supprimer « {deletingItem.title} » ?</h3>
          <p className="text-navy-400 text-[13px] mb-5">Cette action est définitive.</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(deletingItem)}
              className="flex-1 py-2.5 rounded-lg bg-rose-600 text-white font-semibold text-[13.5px] hover:bg-rose-700 transition"
            >
              Supprimer
            </button>
            <button
              onClick={() => setDeletingItem(null)}
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
      <div className="w-[460px] bg-white rounded-2xl p-7 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-navy-400 hover:text-navy-900">✕</button>
        {children}
      </div>
    </div>
  );
}

function ShowcaseFormModal({ item, onClose, onSaved }) {
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [type, setType] = useState(item?.type || "SAAS");
  const [url, setUrl] = useState(item?.url || "");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("type", type);
    form.append("url", url);
    if (image) form.append("image", image);

    try {
      if (item) {
        await api.patch(`/showcase/${item.id}`, form, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/showcase", form, { headers: { "Content-Type": "multipart/form-data" } });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement.");
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display font-bold text-[18px] mb-1">
        {item ? "Modifier la réalisation" : "Nouvelle réalisation"}
      </h3>
      <p className="text-navy-400 text-[13px] mb-5">Visible par tous les clients et développeurs une fois publiée.</p>
      {error && <div className="mb-3 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Titre</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Description</label>
          <textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm min-h-[80px]" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm">
            <option value="SAAS">SaaS</option>
            <option value="MOBILE_APP">App mobile</option>
            <option value="WEB">Site web</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">Lien (optionnel)</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className="w-full px-3.5 py-2.5 rounded-lg border border-navy-100 text-sm" />
        </div>
        <div>
          <label className="block text-[12.5px] text-navy-400 font-medium mb-1.5">
            Image {item?.imageUrl && "(laisser vide pour garder l'image actuelle)"}
          </label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="w-full text-[13px]" />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent text-white font-semibold text-[14px] hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : item ? "Enregistrer les modifications" : "Publier"}
        </button>
      </form>
    </Modal>
  );
}