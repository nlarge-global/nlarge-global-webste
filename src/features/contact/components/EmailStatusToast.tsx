"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
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
  const [dragging, setDragging] = useState(false);

  function getMaximumOffset() {
    const toast = toastRef.current;
    if (!toast) return 0;
    return Math.max(0, window.innerWidth - toast.offsetWidth - 32);
  }

  useEffect(() => {
    const keepToastInViewport = () => {
      setOffset((currentOffset) => Math.min(currentOffset, getMaximumOffset()));
    };
    keepToastInViewport();
    window.addEventListener("resize", keepToastInViewport);
    return () => window.removeEventListener("resize", keepToastInViewport);
  }, []);

  function startDragging(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: offset,
    };
    setDragging(true);
  }

  function moveToast(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(drag.current.pointerId)) return;
    const nextOffset =
      drag.current.startOffset + event.clientX - drag.current.startX;
    setOffset(Math.max(0, Math.min(nextOffset, getMaximumOffset())));
  }

  function stopDragging(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(drag.current.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.current.pointerId);
    }
    setDragging(false);
  }

  function moveWithKeyboard(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setOffset((currentOffset) => {
      const change = event.key === "ArrowLeft" ? -32 : 32;
      return Math.max(0, Math.min(currentOffset + change, getMaximumOffset()));
    });
  }

  return (
    <button
      ref={toastRef}
      role="alert"
      type="button"
      aria-label="Move notification horizontally"
      title="Drag left or right"
      onPointerDown={startDragging}
      onPointerMove={moveToast}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onKeyDown={moveWithKeyboard}
      className={`hover:cursor-grabbing fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-50 flex w-[calc(100%-2rem)] max-w-[26rem] items-center gap-3 rounded-[1.25rem] border border-white/10 bg-[#602329] p-3 text-white shadow-[0_18px_50px_rgba(35,13,16,0.28)] sm:w-auto sm:min-w-[23rem] ${dragging ? "cursor-grabbing" : ""}`}
      style={{
        transform: `translateX(${offset}px)`,
        transition: dragging ? "none" : "transform 180ms ease-out",
      }}
    >
      <div
        className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10"
        aria-hidden="true"
      >
        <FiAlertTriangle className="size-5" />
      </div>
      <div className="min-w-0 flex-1 py-0.5 text-start">
        <p className="text-sm font-semibold leading-5">
          Contact email is unavailable
        </p>
        <p className="text-xs leading-5 text-white/75">
          You can still reach us at{" "}
          <a
            href={`mailto:${recipientEmail}`}
            className="inline-flex items-center font-semibold text-white underline decoration-white/50 underline-offset-4"
          >
            {recipientEmail}
          </a>
        </p>
      </div>
    </button>
  );
}
