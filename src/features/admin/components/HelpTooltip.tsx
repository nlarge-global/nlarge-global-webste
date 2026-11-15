"use client";

import { FiHelpCircle } from "react-icons/fi";

export default function HelpTooltip({ label, children }: { label: string; children: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={`Help: ${label}`}
        className="grid size-7 place-items-center rounded-full text-black/45 hover:bg-black/[0.05] hover:text-[#602329]"
      >
        <FiHelpCircle aria-hidden="true" className="size-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-40 mt-2 hidden w-64 rounded-xl border border-black/10 bg-white p-3 text-left text-xs leading-5 text-black/70 shadow-xl group-focus-within:block group-hover:block"
      >
        {children}
      </span>
    </span>
  );
}
