"use client";

import { ReactNode, useEffect, useRef } from "react";

export default function DialogDraft({ storageKey, children }: { storageKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const draft = sessionStorage.getItem(storageKey);
    if (!draft) return;
    const values = JSON.parse(draft) as Record<string, string>;
    Object.entries(values).forEach(([name, value]) => {
      const field = ref.current?.querySelector<HTMLElement>(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (field) field.value = value;
    });
  }, [storageKey]);
  function save() {
    const values = Object.fromEntries(Array.from(ref.current?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[name]") ?? []).map((field) => [field.name, field.value]));
    sessionStorage.setItem(storageKey, JSON.stringify(values));
  }
  function reset() {
    sessionStorage.removeItem(storageKey);
    ref.current?.querySelector("form")?.reset();
  }
  return <div ref={ref} onChange={save}>{children}<button type="button" onClick={reset} className="mt-2 text-sm font-medium text-[#602329] underline underline-offset-4">Reset saved details</button></div>;
}
