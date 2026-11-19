"use client";

import { useEffect, useRef, useState } from "react";

export default function ProspectSearchInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const lastQuery = useRef(defaultValue);
  const lastSubmitAt = useRef(0);

  useEffect(() => {
    if (value.trim() === lastQuery.current) return;
    let throttleTimer: number | undefined;
    const debounceTimer = window.setTimeout(() => {
      const input = document.getElementById("prospect-search");
      const searchInput = input instanceof HTMLInputElement ? input : null;
      const form = searchInput?.form;
      if (!searchInput || !form) return;
      const submit = () => {
        lastQuery.current = searchInput.value.trim();
        lastSubmitAt.current = Date.now();
        form.requestSubmit();
      };
      const remaining = Math.max(0, 750 - (Date.now() - lastSubmitAt.current));
      if (remaining) throttleTimer = window.setTimeout(submit, remaining);
      else submit();
    }, 350);

    return () => {
      window.clearTimeout(debounceTimer);
      if (throttleTimer !== undefined) window.clearTimeout(throttleTimer);
    };
  }, [value]);

  return (
    <input
      id="prospect-search"
      name="q"
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Name, URL, notes…"
      aria-label="Search prospects by name, URL, or notes"
      className="mt-1.5 min-h-11 w-full rounded-xl border border-black/15 bg-white px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#602329]"
    />
  );
}
