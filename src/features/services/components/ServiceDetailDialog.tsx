"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { FiArrowUpRight, FiX } from "react-icons/fi";
import type { DevelopmentService } from "./ServiceExplorer";

export default function ServiceDetailDialog({
  service,
  origin,
  onClose,
}: {
  service: DevelopmentService;
  origin: { x: number; y: number };
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();

    const bounds = dialog.getBoundingClientRect();
    dialog.style.transformOrigin = `${origin.x - bounds.left}px ${origin.y - bounds.top}px`;
  }, [origin]);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="service-detail-title"
      aria-describedby="service-detail-description"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeDialog();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeDialog();
        }
      }}
      className="service-detail-dialog m-auto max-h-[min(88dvh,48rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-[1.5rem] border-0 bg-white p-0 text-black shadow-[0_24px_80px_rgba(0,0,0,0.22)]"
    >
      <div className="p-6 sm:p-9">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
              Service {service.number}
            </p>
            <h2
              id="service-detail-title"
              className="mt-4 max-w-[16ch] text-4xl font-semibold leading-[0.95] tracking-[-0.05em] sm:text-5xl"
            >
              {service.name}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close service details"
            autoFocus
            onClick={closeDialog}
            className="grid size-11 shrink-0 place-items-center rounded-full border border-black/15 transition-colors hover:bg-[#f1efea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329] cursor-pointer"
          >
            <FiX aria-hidden="true" className="size-5" />
          </button>
        </div>

        <p
          id="service-detail-description"
          className="mt-7 max-w-xl text-base leading-7 text-black/70 sm:text-lg sm:leading-8"
        >
          {service.text}
        </p>

        <ul className="mt-8 grid gap-x-8 gap-y-3 border-t border-black/15 pt-6 sm:grid-cols-2">
          {service.includes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-sm leading-6 text-black/75"
            >
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-[#602329]"
              />
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          onClick={closeDialog}
          className="mt-9 inline-flex min-h-11 items-center gap-3 rounded-full bg-[#602329] py-2 pl-6 pr-3 text-sm font-semibold text-white transition-colors hover:bg-[#481a1e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#602329]"
        >
          Discuss this service
          <span className="grid size-9 place-items-center rounded-full bg-white text-[#602329]">
            <FiArrowUpRight aria-hidden="true" />
          </span>
        </Link>
      </div>
    </dialog>
  );
}
