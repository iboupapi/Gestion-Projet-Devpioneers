import React, { useEffect, useRef, useState } from "react";
import api from "../api/client";
import socket from "../api/socket";
import { useAuth } from "../context/AuthContext";

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) + " · " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

const LINK_KIND_LABELS = {
  TEST: { label: "Lien de test", className: "bg-amber-50 border-amber-200 text-amber-700" },
  FINAL: { label: "Lien définitif", className: "bg-slate-50 border-slate-200 text-slate-600" },
};

function MessageBubble({ message, isMine, onValidate, onImageClick }) {
  const linkKindInfo = message.linkKind ? LINK_KIND_LABELS[message.linkKind] : null;
  const [showInvalidateForm, setShowInvalidateForm] = useState(false);
  const [comment, setComment] = useState("");

  function confirmInvalidate() {
    if (!comment.trim()) return;
    onValidate(false, comment.trim());
    setShowInvalidateForm(false);
    setComment("");
  }

  return (
    <div className={`max-w-[75%] ${isMine ? "self-end" : "self-start"}`}>
      <div
        className={`rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${
          isMine
            ? "bg-gradient-to-br from-violet-accent/15 to-sky-accent/10 border border-violet-accent/25 rounded-br-sm"
            : "bg-white border border-navy-100 rounded-bl-sm"
        }`}
      >
        {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

        {message.type === "LIEN" && message.linkUrl && (
          <div className="flex items-center gap-3 mt-2 p-3 rounded-xl bg-sky-50 border border-sky-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4FC3F7" strokeWidth="2">
              <path d="M10 13a5 5 0 007.07 0l1.93-1.93a5 5 0 00-7.07-7.07L10.5 5.5" />
              <path d="M14 11a5 5 0 00-7.07 0L5 12.93a5 5 0 007.07 7.07L13.5 18.5" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-mono font-semibold truncate">{message.linkUrl}</div>
              <div className="text-[10.5px] text-navy-400">
                {linkKindInfo ? linkKindInfo.label : "Lien partagé"}
              </div>
            </div>
            <a
              href={message.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 bg-navy-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-navy-800"
            >
              Ouvrir
            </a>
          </div>
        )}

        {linkKindInfo && (
          <span className={`inline-block mt-1.5 text-[10.5px] font-semibold border px-2 py-0.5 rounded-full ${linkKindInfo.className}`}>
            {linkKindInfo.label}
          </span>
        )}

        {message.attachments?.map((att) => (
          <div key={att.id} className="mt-2">
            {att.mimeType?.startsWith("image/") ? (
              <img
                src={att.url}
                alt={att.filename}
                onClick={() => onImageClick(att.url)}
                className="rounded-lg max-w-[220px] border border-navy-100 cursor-pointer hover:opacity-90 transition"
              />
            ) : (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-50 border border-navy-100 text-[11px]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <a href={att.url} target="_blank" rel="noreferrer" className="underline">{att.filename}</a>
              </div>
            )}
          </div>
        ))}

        {message.isMockup && (
          <div className="mt-2">
            {message.validated === true && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Maquette validée
              </span>
            )}
            {message.validated === false && (
              <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
                <span className="font-semibold">Maquette invalidée</span>
                {message.validationComment && <p className="mt-0.5 text-rose-500">{message.validationComment}</p>}
              </div>
            )}
            {(message.validated === null || message.validated === undefined) && onValidate && !showInvalidateForm && (
              <div className="flex gap-2">
                <button
                  onClick={() => onValidate(true)}
                  className="text-[11.5px] font-semibold bg-gradient-to-br from-violet-accent to-sky-accent text-white px-3.5 py-1.5 rounded-lg shadow-sm hover:opacity-90"
                >
                  Valider
                </button>
                <button
                  onClick={() => setShowInvalidateForm(true)}
                  className="text-[11.5px] font-semibold bg-white border border-rose-200 text-rose-600 px-3.5 py-1.5 rounded-lg hover:bg-rose-50"
                >
                  Invalider
                </button>
              </div>
            )}
            {(message.validated === null || message.validated === undefined) && onValidate && showInvalidateForm && (
              <div className="flex flex-col gap-1.5">
                <textarea
                  autoFocus
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explique pourquoi cette maquette est invalidée..."
                  rows={2}
                  className="text-[12px] border border-rose-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-400 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={confirmInvalidate}
                    disabled={!comment.trim()}
                    className="text-[11.5px] font-semibold bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Confirmer l'invalidation
                  </button>
                  <button
                    onClick={() => { setShowInvalidateForm(false); setComment(""); }}
                    className="text-[11.5px] font-semibold text-navy-400 px-3 py-1.5 rounded-lg hover:bg-navy-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
            {(message.validated === null || message.validated === undefined) && !onValidate && (
              <span className="inline-block text-[11px] font-semibold text-navy-400 bg-navy-50 border border-navy-100 px-3 py-1 rounded-full">
                En attente de validation
              </span>
            )}
          </div>
        )}
      </div>
      <div className="text-[10.5px] text-navy-400 font-mono mt-1 px-1">
        {message.author?.name} · {formatTime(message.createdAt)}
      </div>
    </div>
  );
}

export default function ChatThread({ projectId, canValidate }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [linkMode, setLinkMode] = useState(false);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(null); // FICHIER | MAQUETTE | TEST | FINAL
  const [previewImage, setPreviewImage] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setFilePreviewUrl(null);
  }, [file]);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  const isDeveloper = user.role === "DEVELOPER";

  async function load() {
    const { data } = await api.get(`/projects/${projectId}/messages`);
    setMessages(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    socket.emit("join_project", projectId);

    function handleNewMessage({ projectId: pid, message }) {
      if (pid !== projectId) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    }

    function handleMessageUpdated({ projectId: pid, message }) {
      if (pid !== projectId) return;
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));
    }

    socket.on("new_message", handleNewMessage);
    socket.on("message_updated", handleMessageUpdated);

    return () => {
      socket.emit("leave_project", projectId);
      socket.off("new_message", handleNewMessage);
      socket.off("message_updated", handleMessageUpdated);
    };
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Options de catégorie affichées selon ce qui est en train d'être envoyé
  const categoryOptions = linkMode
    ? [
        { value: "TEST", label: "Lien de test" },
        { value: "FINAL", label: "Lien définitif" },
        { value: "MAQUETTE", label: "Maquette" },
      ]
    : file
    ? [
        { value: "FICHIER", label: "Fichier simple" },
        { value: "MAQUETTE", label: "Maquette" },
      ]
    : [];

  const showCategoryPicker = isDeveloper && categoryOptions.length > 0;

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f || null);
    setLinkMode(false);
    setCategory(f ? "FICHIER" : null);
  }

  function toggleLinkMode() {
    setLinkMode((v) => {
      const next = !v;
      setFile(null);
      setCategory(next ? "TEST" : null);
      return next;
    });
  }

  function clearFile() {
    setFile(null);
    setCategory(null);
  }

  async function send() {
    if (!text.trim() && !file) return;
    const messageType = linkMode ? "LIEN" : "TEXTE";
    const isMockup = isDeveloper && category === "MAQUETTE";
    const linkKind = isDeveloper && linkMode && category !== "MAQUETTE" ? category : null;

    const form = new FormData();
    form.append("type", messageType);
    form.append("content", text);
    if (messageType === "LIEN") form.append("linkUrl", text.startsWith("http") ? text : `https://${text}`);
    if (file) form.append("file", file);
    form.append("isMockup", isMockup);
    if (linkKind) form.append("linkKind", linkKind);

    await api.post(`/projects/${projectId}/messages`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setText("");
    setFile(null);
    setLinkMode(false);
    setCategory(null);
  }

  async function validate(messageId, approved, comment) {
    await api.patch(`/projects/${projectId}/messages/${messageId}/validate`, { approved, comment });
  }

  return (
    <div className="bg-white border border-navy-100 rounded-2xl flex flex-col h-[70vh] sm:h-[560px] shadow-sm">
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
        {loading && <p className="text-navy-400 text-sm">Chargement des messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-navy-400 text-sm">Aucun message pour l'instant — lancez la discussion.</p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isMine={m.author?.id === user.id}
            onValidate={canValidate && m.isMockup ? (approved, comment) => validate(m.id, approved, comment) : null}
            onImageClick={setPreviewImage}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {file && (
        <div className="border-t border-navy-100 px-3 pt-3 pb-1 flex items-center gap-2.5">
          <div className="relative shrink-0">
            {filePreviewUrl ? (
              <img src={filePreviewUrl} alt="Aperçu" className="w-12 h-12 object-cover rounded-lg border border-navy-100" />
            ) : (
              <div className="w-12 h-12 rounded-lg border border-navy-100 bg-navy-50 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy-400">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </div>
            )}
            <button
              onClick={clearFile}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-navy-700 text-white text-[10px] leading-none flex items-center justify-center hover:bg-rose-600"
              title="Retirer ce fichier"
            >
              ×
            </button>
          </div>
          <span className="text-[11.5px] text-navy-400 truncate">{file.name} — prêt à envoyer</span>
        </div>
      )}

      {showCategoryPicker && (
        <div className="border-t border-navy-100 px-3 pt-2.5 pb-1 flex items-center gap-1.5 flex-wrap">
          {categoryOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCategory(opt.value)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition ${
                category === opt.value
                  ? "border-violet-accent bg-violet-50 text-violet-accent"
                  : "border-navy-100 text-navy-400 hover:border-navy-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-navy-100 p-3 flex items-center gap-2">
        <label className="w-10 h-10 rounded-lg border border-navy-100 flex items-center justify-center cursor-pointer text-navy-400 hover:text-navy-700 hover:border-violet-accent transition shrink-0" title="Joindre un fichier">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
        <button
          onClick={toggleLinkMode}
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition ${linkMode ? "border-violet-accent text-violet-accent bg-violet-50" : "border-navy-100 text-navy-400 hover:text-navy-700"}`}
          title="Partager un lien"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.07 0l1.93-1.93a5 5 0 00-7.07-7.07L10.5 5.5" />
            <path d="M14 11a5 5 0 00-7.07 0L5 12.93a5 5 0 007.07 7.07L13.5 18.5" />
          </svg>
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={linkMode ? "Coller un lien (ex: monsite-test.com)..." : file ? "Ajouter un commentaire (optionnel)..." : "Écrire un message..."}
          className="flex-1 border border-navy-100 rounded-lg px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-violet-accent"
        />
        <button
          onClick={send}
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-accent to-sky-accent flex items-center justify-center shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4">
            <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-zoom-out"
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-5 right-6 text-white/80 hover:text-white text-3xl leading-none"
          >
            ×
          </button>
          <img
            src={previewImage}
            alt="Aperçu"
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[92vh] rounded-lg object-contain cursor-default"
          />
        </div>
      )}
    </div>
  );
}