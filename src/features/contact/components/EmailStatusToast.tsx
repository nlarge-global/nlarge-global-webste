"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { FiAlertTriangle, FiMoreHorizontal } from "react-icons/fi";

interface EmailStatusToastProps {
  recipientEmail: string;
}

export default function EmailStatusToast({
  recipientEmail,
}: EmailStatusToastProps) {
  const toastRef = useRef<HTMLButtonElement>(null);
  const drag = useRef({ pointerId: 0, startX: 0, startOffset: 0 });
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const keepToastInViewport = () => {
      const toast = toastRef.current;
      if (!toast) return;
      const maximumOffset = Math.max(
        0,
        window.innerWidth - toast.offsetWidth - 32,
      );
      setOffset((currentOffset) => Math.min(currentOffset, maximumOffset));
    };

    keepToastInViewport();
    window.addEventListener("resize", keepToastInViewport);
    return () => window.removeEventListener("resize", keepToastInViewport);
  }, []);

  function startDragging(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offset,
    };
  }

  function moveToast(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(drag.current.pointerId)) return;

    const toast = toastRef.current;
    if (!toast) return;
    const maximumOffset = Math.max(
      0,
      window.innerWidth - toast.offsetWidth - 32,
    );
    const nextOffset =
      drag.current.startOffset + event.clientX - drag.current.startX;
    setOffset(Math.max(0, Math.min(nextOffset, maximumOffset)));
  }

  function stopDragging(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(drag.current.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.current.pointerId);
    }
  }

  return (
    <button
      ref={toastRef}
      type="button"
      aria-label="Drag notification to move it horizontally"
      title="Drag to move"
      onPointerDown={startDragging}
      onPointerMove={moveToast}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      role="alert"
      className="hover:cursor-grabbing fixed bottom-4 left-4 z-50 flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl bg-[#602329] px-4 py-3 pr-2 text-sm font-medium text-white shadow-xl"
      style={{ transform: `translateX(${offset}px)` }}
    >
      <FiAlertTriangle
        className="mt-0.5 shrink-0 size-10 text-lg"
        aria-hidden="true"
      />
      <p className="leading-6 text-start">
        Contact email is currently unavailable.
        <br />
        Please email{" "}
        <a
          href={`mailto:${recipientEmail}`}
          className="underline underline-offset-2"
        >
          {recipientEmail}
        </a>{" "}
        while this is being resolved.
      </p>
    </button>
  );
}
