"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Button } from "./ui/Button";

export default function DialogDraft({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const draft = sessionStorage.getItem(storageKey);
    if (!draft) return;
    const values = JSON.parse(draft) as Record<string, string>;
    Object.entries(values).forEach(([name, value]) => {
      const field = ref.current?.querySelector<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >(
        `[name="${name}"]`,
      );
      if (!field) return;
      const prototype =
        field instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : field instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, value);
      field.dispatchEvent(
        new Event(field instanceof HTMLSelectElement ? "change" : "input", {
          bubbles: true,
        }),
      );
    });
  }, [storageKey]);
  function save() {
    const values = Object.fromEntries(
      Array.from(
        ref.current?.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >("[name]") ?? [],
      ).map((field) => [field.name, field.value]),
    );
    sessionStorage.setItem(storageKey, JSON.stringify(values));
  }
  function reset() {
    sessionStorage.removeItem(storageKey);
    ref.current?.querySelector("form")?.reset();
  }
  return (
    <div ref={ref} onChange={save}>
      {children}
      <Button
        type="button"
        variant="outline"
        size="default"
        onClick={reset}
        className="ml-auto block"
      >
        Reset
      </Button>
    </div>
  );
}
