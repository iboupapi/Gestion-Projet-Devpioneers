import React, { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default function ProjectAssets({ projectId }) {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const canUpload = user.role === "CLIENT" || user.role === "ADMIN";

  async function load() {
    const { data } = await api.get(`/projects/${projectId}/assets`);
    setAssets(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      await api.post(`/projects/${projectId}/assets`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    setUploading(false);
    e.target.value = "";
    load();
  }

  async function handleDelete(assetId) {
    await api.delete(`/projects/${projectId}/assets/${assetId}`);
    setConfirmDeleteId(null);
    load();
  }

  function download(asset) {
    const link = document.createElement("a");
    link.href = asset.url;
    link.download = asset.filename;
    link.click();
  }

  return (
    <div className="bg-white border border-navy-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-[14px] font-bold text-navy-800">Images du projet</h3>
          <p className="text-[11.5px] text-navy-400">
            {canUpload
              ? "Ajoute des images à tout moment — les développeurs pourront les consulter et les télécharger."
              : "Images ajoutées par le client, disponibles au téléchargement."}
          </p>
        </div>
        {canUpload && (
          <label className="shrink-0 text-[12px] font-semibold bg-gradient-to-br from-violet-accent to-sky-accent text-white px-4 py-2 rounded-lg cursor-pointer hover:opacity-90 transition">
            {uploading ? "Envoi..." : "+ Ajouter des images"}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {loading && <p className="text-navy-400 text-sm">Chargement...</p>}

      {!loading && assets.length === 0 && (
        <div className="border border-dashed border-navy-100 rounded-xl py-10 text-center">
          <p className="text-navy-400 text-[13px]">Aucune image pour l'instant.</p>
        </div>
      )}

      {!loading && assets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {assets.map((asset) => (
            <div key={asset.id} className="group relative rounded-xl overflow-hidden border border-navy-100 bg-navy-50">
              <img
                src={asset.url}
                alt={asset.filename}
                onClick={() => setPreview(asset.url)}
                className="w-full h-32 object-cover cursor-pointer"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                {confirmDeleteId !== asset.id && (
                  <>
                    <button
                      onClick={() => download(asset)}
                      title="Télécharger"
                      className="w-7 h-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-white"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e2a4a" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    {(asset.uploadedById === user.id || user.role === "ADMIN") && (
                      <button
                        onClick={() => setConfirmDeleteId(asset.id)}
                        title="Supprimer"
                        className="w-7 h-7 rounded-md bg-white/90 flex items-center justify-center hover:bg-rose-50"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>

              {confirmDeleteId === asset.id && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2">
                  <p className="text-white text-[10.5px] text-center leading-snug">Supprimer cette image ?</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="text-[10.5px] font-semibold bg-rose-600 text-white px-2.5 py-1 rounded-md hover:bg-rose-700"
                    >
                      Supprimer
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-[10.5px] font-semibold bg-white/90 text-navy-700 px-2.5 py-1 rounded-md hover:bg-white"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
              <div className="px-2 py-1.5 bg-white">
                <div className="text-[10.5px] text-navy-500 truncate">{asset.filename}</div>
                <div className="text-[9.5px] text-navy-300">
                  {asset.uploadedBy?.name} · {formatSize(asset.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-zoom-out"
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-5 right-6 text-white/80 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
          <img
            src={preview}
            alt="Aperçu"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[92vh] rounded-lg object-contain cursor-default"
          />
        </div>
      )}
    </div>
  );
}