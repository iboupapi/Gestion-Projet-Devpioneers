import React from "react";
import logoMark from "../assets/logo-mark.jpeg";

export default function Logo({ withText = true, size = 34 }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoMark}
        alt="DevPioneers"
        style={{ width: size, height: size }}
        className="rounded-[9px] object-cover shrink-0"
      />
      {withText && (
        <span className="font-display font-bold text-navy-800 text-[15px] tracking-tight">
          DevPioneers
        </span>
      )}
    </div>
  );
}
