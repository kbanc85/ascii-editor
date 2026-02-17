"use client";

import { useState, type ReactNode } from "react";

interface SectionProps {
  label: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function Section({
  label,
  children,
  defaultOpen = true,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-dim/50 font-medium hover:text-text-dim transition-colors py-1"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        {label}
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 pt-2 pb-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
