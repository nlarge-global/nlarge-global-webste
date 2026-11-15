"use client";

import { useEffect, useRef } from "react";

export function useDialogEscape(
  open: boolean,
  onEscape: () => void,
  disabled = false,
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || disabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const dialogs = document.querySelectorAll<HTMLElement>(
        '[role="dialog"][aria-modal="true"]',
      );
      if (dialogs[dialogs.length - 1] !== ref.current) return;
      event.preventDefault();
      event.stopPropagation();
      onEscape();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, disabled, onEscape]);

  return ref;
}
