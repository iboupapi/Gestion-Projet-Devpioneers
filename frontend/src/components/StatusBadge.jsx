import React from "react";

const STATUS_MAP = {
  EN_ATTENTE: { label: "En attente", classes: "bg-amber-100 text-amber-700" },
  EN_COURS: { label: "En cours", classes: "bg-sky-100 text-sky-700" },
  EN_REVISION: { label: "En révision", classes: "bg-violet-100 text-violet-700" },
  LIVRE: { label: "Livré", classes: "bg-emerald-100 text-emerald-700" },
  TERMINE: { label: "Terminé", classes: "bg-navy-100 text-navy-600" },
};

export default function StatusBadge({ status, className = "" }) {
  const cfg = STATUS_MAP[status] || { label: status, classes: "bg-gray-100 text-gray-700" };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${cfg.classes} ${className}`}
    >
      {cfg.label}
    </span>
  );
}

export { STATUS_MAP };
